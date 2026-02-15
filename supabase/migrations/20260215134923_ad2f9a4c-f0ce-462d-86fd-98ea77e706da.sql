
-- =============================================
-- 1. AI Provider Settings (per user)
-- =============================================
CREATE TABLE public.ai_provider_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'google', 'grok', 'custom')),
  api_key_encrypted TEXT,
  base_url TEXT,
  model_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  use_admin_ai BOOLEAN NOT NULL DEFAULT false,
  admin_code_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai settings"
  ON public.ai_provider_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai settings"
  ON public.ai_provider_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai settings"
  ON public.ai_provider_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can view all
CREATE POLICY "Admins can view all ai settings"
  ON public.ai_provider_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all ai settings"
  ON public.ai_provider_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. Admin Activation Codes
-- =============================================
CREATE TABLE public.admin_activation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  daily_message_limit INTEGER DEFAULT 50,
  daily_comment_limit INTEGER DEFAULT 50,
  monthly_total_limit INTEGER DEFAULT 1000,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activation_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activation codes"
  ON public.admin_activation_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their assigned codes"
  ON public.admin_activation_codes FOR SELECT
  USING (assigned_user_id = auth.uid());

-- =============================================
-- 3. User Usage Limits (admin-configurable)
-- =============================================
CREATE TABLE public.user_usage_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  daily_message_limit INTEGER NOT NULL DEFAULT 50,
  daily_comment_limit INTEGER NOT NULL DEFAULT 50,
  monthly_total_limit INTEGER NOT NULL DEFAULT 1000,
  is_automation_enabled BOOLEAN NOT NULL DEFAULT true,
  set_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits"
  ON public.user_usage_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all limits"
  ON public.user_usage_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 4. Daily Usage Tracker
-- =============================================
CREATE TABLE public.daily_usage_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  total_ai_calls INTEGER NOT NULL DEFAULT 0,
  is_limit_reached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.daily_usage_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.daily_usage_tracker FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage"
  ON public.daily_usage_tracker FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 5. Monthly Usage Aggregation View
-- =============================================
CREATE OR REPLACE VIEW public.monthly_usage_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', usage_date)::date AS month,
  SUM(message_count) AS total_messages,
  SUM(comment_count) AS total_comments,
  SUM(total_ai_calls) AS total_ai_calls
FROM public.daily_usage_tracker
GROUP BY user_id, DATE_TRUNC('month', usage_date);

-- =============================================
-- 6. Function to increment usage and check limits
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_user_id UUID,
  p_usage_type TEXT -- 'message' or 'comment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_daily_tracker RECORD;
  v_limits RECORD;
  v_monthly_total INTEGER;
  v_can_proceed BOOLEAN := true;
  v_reason TEXT := '';
BEGIN
  -- Get or create daily tracker
  INSERT INTO daily_usage_tracker (user_id, usage_date)
  VALUES (p_user_id, v_today)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT * INTO v_daily_tracker
  FROM daily_usage_tracker
  WHERE user_id = p_user_id AND usage_date = v_today;

  -- Get limits
  SELECT * INTO v_limits
  FROM user_usage_limits
  WHERE user_id = p_user_id;

  -- If no limits set, use defaults
  IF v_limits IS NULL THEN
    INSERT INTO user_usage_limits (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO v_limits
    FROM user_usage_limits
    WHERE user_id = p_user_id;
  END IF;

  -- Check if automation is enabled
  IF NOT v_limits.is_automation_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Automation disabled by admin');
  END IF;

  -- Check daily limits
  IF p_usage_type = 'message' AND v_daily_tracker.message_count >= v_limits.daily_message_limit THEN
    v_can_proceed := false;
    v_reason := 'Daily message limit reached (' || v_limits.daily_message_limit || ')';
  ELSIF p_usage_type = 'comment' AND v_daily_tracker.comment_count >= v_limits.daily_comment_limit THEN
    v_can_proceed := false;
    v_reason := 'Daily comment limit reached (' || v_limits.daily_comment_limit || ')';
  END IF;

  -- Check monthly limit
  IF v_can_proceed THEN
    SELECT COALESCE(SUM(total_ai_calls), 0) INTO v_monthly_total
    FROM daily_usage_tracker
    WHERE user_id = p_user_id
      AND usage_date >= DATE_TRUNC('month', v_today)::date;

    IF v_monthly_total >= v_limits.monthly_total_limit THEN
      v_can_proceed := false;
      v_reason := 'Monthly AI usage limit reached (' || v_limits.monthly_total_limit || ')';
    END IF;
  END IF;

  -- If limit reached, mark it
  IF NOT v_can_proceed THEN
    UPDATE daily_usage_tracker
    SET is_limit_reached = true, updated_at = now()
    WHERE user_id = p_user_id AND usage_date = v_today;

    RETURN jsonb_build_object('allowed', false, 'reason', v_reason);
  END IF;

  -- Increment counters
  UPDATE daily_usage_tracker
  SET 
    message_count = CASE WHEN p_usage_type = 'message' THEN message_count + 1 ELSE message_count END,
    comment_count = CASE WHEN p_usage_type = 'comment' THEN comment_count + 1 ELSE comment_count END,
    total_ai_calls = total_ai_calls + 1,
    updated_at = now()
  WHERE user_id = p_user_id AND usage_date = v_today;

  RETURN jsonb_build_object(
    'allowed', true,
    'daily_messages_used', v_daily_tracker.message_count + CASE WHEN p_usage_type = 'message' THEN 1 ELSE 0 END,
    'daily_comments_used', v_daily_tracker.comment_count + CASE WHEN p_usage_type = 'comment' THEN 1 ELSE 0 END,
    'daily_message_limit', v_limits.daily_message_limit,
    'daily_comment_limit', v_limits.daily_comment_limit
  );
END;
$$;

-- =============================================
-- 7. Function to validate activation code
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_activation_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Set user limits from code
  INSERT INTO user_usage_limits (user_id, daily_message_limit, daily_comment_limit, monthly_total_limit)
  VALUES (p_user_id, v_code.daily_message_limit, v_code.daily_comment_limit, v_code.monthly_total_limit)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_message_limit = v_code.daily_message_limit,
    daily_comment_limit = v_code.daily_comment_limit,
    monthly_total_limit = v_code.monthly_total_limit,
    updated_at = now();

  RETURN jsonb_build_object(
    'valid', true,
    'daily_message_limit', v_code.daily_message_limit,
    'daily_comment_limit', v_code.daily_comment_limit,
    'monthly_total_limit', v_code.monthly_total_limit
  );
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_ai_provider_settings_updated_at
  BEFORE UPDATE ON public.ai_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_activation_codes_updated_at
  BEFORE UPDATE ON public.admin_activation_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_limits_updated_at
  BEFORE UPDATE ON public.user_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_usage_tracker_updated_at
  BEFORE UPDATE ON public.daily_usage_tracker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
