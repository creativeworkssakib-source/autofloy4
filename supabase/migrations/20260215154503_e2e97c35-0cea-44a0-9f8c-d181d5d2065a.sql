
-- Fix validate_activation_code to also set is_automation_enabled = true
CREATE OR REPLACE FUNCTION public.validate_activation_code(p_user_id uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code RECORD;
BEGIN
  SELECT * INTO v_code
  FROM admin_activation_codes
  WHERE code = p_code
    AND is_active = true
    AND (assigned_user_id IS NULL OR assigned_user_id = p_user_id)
    AND (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses;

  IF v_code IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Invalid or expired code');
  END IF;

  -- Activate admin AI for user
  INSERT INTO ai_provider_settings (user_id, use_admin_ai, admin_code_id, is_active)
  VALUES (p_user_id, true, v_code.id, true)
  ON CONFLICT (user_id) DO UPDATE SET
    use_admin_ai = true,
    admin_code_id = v_code.id,
    is_active = true,
    updated_at = now();

  -- Increment code usage
  UPDATE admin_activation_codes
  SET current_uses = current_uses + 1,
      assigned_user_id = p_user_id,
      updated_at = now()
  WHERE id = v_code.id;

  -- Set user limits from code AND enable automation
  INSERT INTO user_usage_limits (user_id, daily_message_limit, daily_comment_limit, monthly_total_limit, is_automation_enabled)
  VALUES (p_user_id, v_code.daily_message_limit, v_code.daily_comment_limit, v_code.monthly_total_limit, true)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_message_limit = v_code.daily_message_limit,
    daily_comment_limit = v_code.daily_comment_limit,
    monthly_total_limit = v_code.monthly_total_limit,
    is_automation_enabled = true,
    updated_at = now();

  RETURN jsonb_build_object(
    'valid', true,
    'daily_message_limit', v_code.daily_message_limit,
    'daily_comment_limit', v_code.daily_comment_limit,
    'monthly_total_limit', v_code.monthly_total_limit
  );
END;
$function$;

-- Fix the current broken data: enable automation for users who have admin AI active
UPDATE user_usage_limits 
SET is_automation_enabled = true 
WHERE user_id IN (
  SELECT user_id FROM ai_provider_settings WHERE use_admin_ai = true AND is_active = true
);
