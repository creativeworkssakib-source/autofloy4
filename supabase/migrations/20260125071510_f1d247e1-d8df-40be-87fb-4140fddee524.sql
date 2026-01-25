-- Drop and recreate the delete_user_completely function with ALL shop tables
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id uuid, p_preserve_email_history boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email TEXT;
  v_plan TEXT;
  v_is_trial BOOLEAN;
  v_subscription_expires_at TIMESTAMPTZ;
  v_trial_end_date TIMESTAMPTZ;
BEGIN
  -- Get user info before deletion (including subscription dates)
  SELECT email, subscription_plan, is_trial_active, subscription_expires_at, trial_end_date
  INTO v_email, v_plan, v_is_trial, v_subscription_expires_at, v_trial_end_date
  FROM users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- If preserving email history (for trial abuse prevention)
  IF p_preserve_email_history THEN
    INSERT INTO email_usage_history (
      email, 
      trial_used, 
      last_plan, 
      last_subscription_status, 
      last_account_deleted_at,
      subscription_expires_at
    )
    VALUES (
      LOWER(v_email), 
      true, 
      v_plan, 
      CASE WHEN v_is_trial THEN 'trial' ELSE 'paid' END, 
      now(),
      COALESCE(v_subscription_expires_at, v_trial_end_date)
    )
    ON CONFLICT (email) DO UPDATE SET
      last_plan = EXCLUDED.last_plan,
      last_subscription_status = EXCLUDED.last_subscription_status,
      last_account_deleted_at = now(),
      subscription_expires_at = EXCLUDED.subscription_expires_at,
      total_signups = email_usage_history.total_signups + 1,
      updated_at = now();
  END IF;
  
  -- Delete all user data from all tables (in correct order to respect foreign keys)
  
  -- ============ SHOP TRASH (this was missing!) ============
  DELETE FROM shop_trash WHERE user_id = p_user_id;
  
  -- ============ SHOP SCANNER DATA ============
  DELETE FROM shop_scanner_logs WHERE user_id = p_user_id;
  DELETE FROM shop_scanner_devices WHERE user_id = p_user_id;
  
  -- ============ SHOP LOAN DATA ============
  DELETE FROM shop_loan_payments WHERE loan_id IN (SELECT id FROM shop_loans WHERE user_id = p_user_id);
  DELETE FROM shop_loans WHERE user_id = p_user_id;
  
  -- ============ SHOP SUPPLIER DATA ============
  DELETE FROM shop_supplier_payments WHERE user_id = p_user_id;
  DELETE FROM shop_supplier_returns WHERE user_id = p_user_id;
  
  -- ============ SHOP SALE DATA ============
  DELETE FROM shop_sale_items WHERE sale_id IN (SELECT id FROM shop_sales WHERE user_id = p_user_id);
  DELETE FROM shop_sales WHERE user_id = p_user_id;
  
  -- ============ SHOP PURCHASE DATA ============
  DELETE FROM shop_purchase_items WHERE purchase_id IN (SELECT id FROM shop_purchases WHERE user_id = p_user_id);
  DELETE FROM shop_purchase_payments WHERE user_id = p_user_id;
  DELETE FROM shop_purchases WHERE user_id = p_user_id;
  
  -- ============ SHOP PRODUCT DATA ============
  DELETE FROM shop_stock_batches WHERE user_id = p_user_id;
  DELETE FROM shop_product_history WHERE user_id = p_user_id;
  DELETE FROM shop_products WHERE user_id = p_user_id;
  
  -- ============ OTHER SHOP DATA ============
  DELETE FROM shop_categories WHERE user_id = p_user_id;
  DELETE FROM shop_customers WHERE user_id = p_user_id;
  DELETE FROM shop_suppliers WHERE user_id = p_user_id;
  DELETE FROM shop_expenses WHERE user_id = p_user_id;
  DELETE FROM shop_quick_expenses WHERE user_id = p_user_id;
  DELETE FROM shop_returns WHERE user_id = p_user_id;
  DELETE FROM shop_damages WHERE user_id = p_user_id;
  DELETE FROM shop_stock_adjustments WHERE user_id = p_user_id;
  DELETE FROM shop_cash_transactions WHERE user_id = p_user_id;
  DELETE FROM shop_daily_cash_register WHERE user_id = p_user_id;
  DELETE FROM shop_staff_users WHERE user_id = p_user_id;
  DELETE FROM shop_settings WHERE user_id = p_user_id;
  DELETE FROM shops WHERE user_id = p_user_id;
  
  -- ============ AI & AUTOMATION DATA ============
  DELETE FROM ai_orders WHERE user_id = p_user_id;
  DELETE FROM ai_conversations WHERE user_id = p_user_id;
  DELETE FROM facebook_posts WHERE user_id = p_user_id;
  DELETE FROM execution_logs WHERE user_id = p_user_id;
  DELETE FROM automations WHERE user_id = p_user_id;
  DELETE FROM page_memory WHERE user_id = p_user_id;
  DELETE FROM connected_accounts WHERE user_id = p_user_id;
  DELETE FROM outgoing_events WHERE user_id = p_user_id;
  
  -- ============ MARKETING DATA ============
  DELETE FROM marketing_message_logs WHERE user_id = p_user_id;
  DELETE FROM marketing_campaigns WHERE user_id = p_user_id;
  DELETE FROM marketing_phone_numbers WHERE user_id = p_user_id;
  DELETE FROM marketing_whatsapp_groups WHERE user_id = p_user_id;
  DELETE FROM marketing_whatsapp_accounts WHERE user_id = p_user_id;
  DELETE FROM marketing_blacklist WHERE user_id = p_user_id;
  DELETE FROM incomplete_orders WHERE user_id = p_user_id;
  DELETE FROM fraud_detection_logs WHERE user_id = p_user_id;
  
  -- ============ PRODUCT DATA ============
  DELETE FROM products WHERE user_id = p_user_id;
  DELETE FROM product_variants WHERE user_id = p_user_id;
  DELETE FROM product_categories WHERE user_id = p_user_id;
  
  -- ============ OTHER USER DATA ============
  DELETE FROM orders WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM reviews WHERE user_id = p_user_id;
  DELETE FROM payment_requests WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM account_deletion_otps WHERE user_id = p_user_id;
  
  -- ============ FINALLY DELETE THE USER ============
  DELETE FROM users WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$function$;