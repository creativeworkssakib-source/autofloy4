-- Add subscription_expires_at column to track when user's plan expires
ALTER TABLE email_usage_history 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update the can_email_use_trial function to return subscription expiry info
CREATE OR REPLACE FUNCTION can_email_use_trial(p_email TEXT)
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
      'subscription_expires_at', v_history.subscription_expires_at,
      'total_signups', v_history.total_signups
    );
  END IF;
END;
$$;