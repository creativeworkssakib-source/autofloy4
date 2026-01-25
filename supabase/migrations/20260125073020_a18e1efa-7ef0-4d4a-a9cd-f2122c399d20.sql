-- Fix delete_user_completely function - some tables don't have user_id column
DROP FUNCTION IF EXISTS public.delete_user_completely(uuid);

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete shop-related data first (due to foreign key constraints)
  -- Tables with user_id column
  DELETE FROM shop_trash WHERE user_id = target_user_id;
  DELETE FROM shop_scanner_logs WHERE user_id = target_user_id;
  DELETE FROM shop_scanner_devices WHERE user_id = target_user_id;
  DELETE FROM shop_loan_payments WHERE user_id = target_user_id;
  DELETE FROM shop_loans WHERE user_id = target_user_id;
  DELETE FROM shop_supplier_payments WHERE user_id = target_user_id;
  DELETE FROM shop_supplier_returns WHERE user_id = target_user_id;
  
  -- shop_sale_items doesn't have user_id - delete via sale_id
  DELETE FROM shop_sale_items WHERE sale_id IN (SELECT id FROM shop_sales WHERE user_id = target_user_id);
  DELETE FROM shop_sales WHERE user_id = target_user_id;
  
  -- shop_purchase_items doesn't have user_id - delete via purchase_id  
  DELETE FROM shop_purchase_items WHERE purchase_id IN (SELECT id FROM shop_purchases WHERE user_id = target_user_id);
  DELETE FROM shop_purchase_payments WHERE user_id = target_user_id;
  DELETE FROM shop_purchases WHERE user_id = target_user_id;
  
  DELETE FROM shop_stock_batches WHERE user_id = target_user_id;
  DELETE FROM shop_product_history WHERE user_id = target_user_id;
  DELETE FROM shop_products WHERE user_id = target_user_id;
  DELETE FROM shop_categories WHERE user_id = target_user_id;
  DELETE FROM shop_customers WHERE user_id = target_user_id;
  DELETE FROM shop_suppliers WHERE user_id = target_user_id;
  DELETE FROM shop_expenses WHERE user_id = target_user_id;
  DELETE FROM shop_quick_expenses WHERE user_id = target_user_id;
  DELETE FROM shop_returns WHERE user_id = target_user_id;
  DELETE FROM shop_damages WHERE user_id = target_user_id;
  DELETE FROM shop_stock_adjustments WHERE user_id = target_user_id;
  DELETE FROM shop_cash_transactions WHERE user_id = target_user_id;
  DELETE FROM shop_daily_cash_register WHERE user_id = target_user_id;
  DELETE FROM shop_staff_users WHERE user_id = target_user_id;
  DELETE FROM shop_settings WHERE user_id = target_user_id;
  DELETE FROM shops WHERE user_id = target_user_id;
  
  -- Delete AI/automation data
  DELETE FROM ai_conversations WHERE user_id = target_user_id;
  DELETE FROM ai_orders WHERE user_id = target_user_id;
  DELETE FROM execution_logs WHERE user_id = target_user_id;
  DELETE FROM automations WHERE user_id = target_user_id;
  DELETE FROM page_memory WHERE user_id = target_user_id;
  DELETE FROM connected_accounts WHERE user_id = target_user_id;
  DELETE FROM facebook_posts WHERE user_id = target_user_id;
  
  -- Delete marketing data
  DELETE FROM marketing_message_logs WHERE user_id = target_user_id;
  DELETE FROM marketing_campaigns WHERE user_id = target_user_id;
  DELETE FROM marketing_phone_numbers WHERE user_id = target_user_id;
  DELETE FROM marketing_whatsapp_groups WHERE user_id = target_user_id;
  DELETE FROM marketing_whatsapp_accounts WHERE user_id = target_user_id;
  DELETE FROM marketing_blacklist WHERE user_id = target_user_id;
  DELETE FROM fraud_detection_logs WHERE user_id = target_user_id;
  DELETE FROM incomplete_orders WHERE user_id = target_user_id;
  
  -- Delete products and orders
  DELETE FROM product_variants WHERE user_id = target_user_id;
  DELETE FROM product_categories WHERE user_id = target_user_id;
  DELETE FROM products WHERE user_id = target_user_id;
  DELETE FROM orders WHERE user_id = target_user_id;
  
  -- Delete notifications and events
  DELETE FROM notifications WHERE user_id = target_user_id;
  DELETE FROM outgoing_events WHERE user_id = target_user_id;
  
  -- Delete payment requests
  DELETE FROM payment_requests WHERE user_id = target_user_id;
  
  -- Delete subscription
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  
  -- Delete OTPs
  DELETE FROM account_deletion_otps WHERE user_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Finally delete the user
  DELETE FROM users WHERE id = target_user_id;
END;
$$;