-- Update the delete_user_completely function to include all tables
CREATE OR REPLACE FUNCTION delete_user_completely(p_user_id UUID, p_preserve_email_history BOOLEAN DEFAULT TRUE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_plan TEXT;
  v_is_trial BOOLEAN;
BEGIN
  -- Get user info before deletion
  SELECT email, subscription_plan, is_trial_active 
  INTO v_email, v_plan, v_is_trial
  FROM users WHERE id = p_user_id;
  
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- If preserving email history (for trial abuse prevention)
  IF p_preserve_email_history THEN
    INSERT INTO email_usage_history (email, trial_used, last_plan, last_subscription_status, last_account_deleted_at)
    VALUES (LOWER(v_email), true, v_plan, CASE WHEN v_is_trial THEN 'trial' ELSE 'paid' END, now())
    ON CONFLICT (email) DO UPDATE SET
      last_plan = EXCLUDED.last_plan,
      last_subscription_status = EXCLUDED.last_subscription_status,
      last_account_deleted_at = now(),
      total_signups = email_usage_history.total_signups + 1,
      updated_at = now();
  END IF;
  
  -- Delete all user data from all tables (cascade will handle most)
  -- Explicitly delete from tables that might not have cascade
  
  -- Delete shop supplier data first (references suppliers)
  DELETE FROM shop_supplier_payments WHERE user_id = p_user_id;
  DELETE FROM shop_supplier_returns WHERE user_id = p_user_id;
  
  -- Delete shop sale data
  DELETE FROM shop_sale_items WHERE sale_id IN (SELECT id FROM shop_sales WHERE user_id = p_user_id);
  DELETE FROM shop_sales WHERE user_id = p_user_id;
  
  -- Delete shop purchase data
  DELETE FROM shop_purchase_items WHERE purchase_id IN (SELECT id FROM shop_purchases WHERE user_id = p_user_id);
  DELETE FROM shop_purchase_payments WHERE user_id = p_user_id;
  DELETE FROM shop_purchases WHERE user_id = p_user_id;
  
  -- Delete shop products and related
  DELETE FROM shop_products WHERE user_id = p_user_id;
  DELETE FROM shop_categories WHERE user_id = p_user_id;
  DELETE FROM shop_customers WHERE user_id = p_user_id;
  DELETE FROM shop_suppliers WHERE user_id = p_user_id;
  DELETE FROM shop_expenses WHERE user_id = p_user_id;
  DELETE FROM shop_returns WHERE user_id = p_user_id;
  DELETE FROM shop_damages WHERE user_id = p_user_id;
  DELETE FROM shop_stock_adjustments WHERE user_id = p_user_id;
  DELETE FROM shop_cash_transactions WHERE user_id = p_user_id;
  DELETE FROM shop_staff_users WHERE user_id = p_user_id;
  DELETE FROM shop_settings WHERE user_id = p_user_id;
  DELETE FROM shops WHERE user_id = p_user_id;
  
  -- Delete automation data
  DELETE FROM execution_logs WHERE user_id = p_user_id;
  DELETE FROM automations WHERE user_id = p_user_id;
  DELETE FROM page_memory WHERE user_id = p_user_id;
  DELETE FROM connected_accounts WHERE user_id = p_user_id;
  
  -- Delete other user data
  DELETE FROM products WHERE user_id = p_user_id;
  DELETE FROM product_variants WHERE user_id = p_user_id;
  DELETE FROM product_categories WHERE user_id = p_user_id;
  DELETE FROM orders WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM reviews WHERE user_id = p_user_id;
  DELETE FROM outgoing_events WHERE user_id = p_user_id;
  DELETE FROM user_roles WHERE user_id = p_user_id;
  DELETE FROM account_deletion_otps WHERE user_id = p_user_id;
  
  -- Finally delete the user
  DELETE FROM users WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'email', v_email);
END;
$$;