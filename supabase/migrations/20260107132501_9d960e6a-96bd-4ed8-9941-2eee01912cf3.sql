-- Create email usage history table to track trial usage per email
CREATE TABLE public.email_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_signup_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_used BOOLEAN NOT NULL DEFAULT true,
  last_plan TEXT DEFAULT 'free',
  last_subscription_status TEXT DEFAULT 'trial',
  last_account_deleted_at TIMESTAMP WITH TIME ZONE,
  total_signups INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_usage_history ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no public access)
CREATE POLICY "Service role only" 
ON public.email_usage_history 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create account deletion OTP table
CREATE TABLE public.account_deletion_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_deletion_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only for deletion otps" 
ON public.account_deletion_otps 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to completely delete user and all their data
CREATE OR REPLACE FUNCTION public.delete_user_completely(p_user_id UUID, p_preserve_email_history BOOLEAN DEFAULT true)
RETURNS JSONB
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
  
  -- Delete shop data
  DELETE FROM shop_sale_items WHERE sale_id IN (SELECT id FROM shop_sales WHERE user_id = p_user_id);
  DELETE FROM shop_sales WHERE user_id = p_user_id;
  DELETE FROM shop_purchase_items WHERE purchase_id IN (SELECT id FROM shop_purchases WHERE user_id = p_user_id);
  DELETE FROM shop_purchase_payments WHERE user_id = p_user_id;
  DELETE FROM shop_purchases WHERE user_id = p_user_id;
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

-- Function to check if email can use trial
CREATE OR REPLACE FUNCTION public.can_email_use_trial(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history RECORD;
BEGIN
  SELECT * INTO v_history 
  FROM email_usage_history 
  WHERE email = LOWER(p_email);
  
  IF v_history IS NULL THEN
    -- New email, can use trial
    RETURN jsonb_build_object('can_use_trial', true, 'is_returning_user', false);
  ELSE
    -- Existing email, cannot use trial
    RETURN jsonb_build_object(
      'can_use_trial', false, 
      'is_returning_user', true,
      'last_plan', v_history.last_plan,
      'last_status', v_history.last_subscription_status,
      'total_signups', v_history.total_signups
    );
  END IF;
END;
$$;