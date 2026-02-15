
-- Fix security definer view
DROP VIEW IF EXISTS public.monthly_usage_summary;
CREATE OR REPLACE VIEW public.monthly_usage_summary
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  DATE_TRUNC('month', usage_date)::date AS month,
  SUM(message_count) AS total_messages,
  SUM(comment_count) AS total_comments,
  SUM(total_ai_calls) AS total_ai_calls
FROM public.daily_usage_tracker
GROUP BY user_id, DATE_TRUNC('month', usage_date);

-- Fix overly permissive admin policies - replace with proper has_role checks
DROP POLICY IF EXISTS "Admins can update all ai settings" ON public.ai_provider_settings;
DROP POLICY IF EXISTS "Admins can manage activation codes" ON public.admin_activation_codes;
DROP POLICY IF EXISTS "Admins can manage all limits" ON public.user_usage_limits;
DROP POLICY IF EXISTS "Admins can view all usage" ON public.daily_usage_tracker;

-- Recreate with proper per-operation policies
CREATE POLICY "Admins can select all ai settings" ON public.ai_provider_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ai settings" ON public.ai_provider_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can select activation codes" ON public.admin_activation_codes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert activation codes" ON public.admin_activation_codes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update activation codes" ON public.admin_activation_codes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete activation codes" ON public.admin_activation_codes FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can select all limits" ON public.user_usage_limits FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert limits" ON public.user_usage_limits FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update limits" ON public.user_usage_limits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can select all usage" ON public.daily_usage_tracker FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert usage" ON public.daily_usage_tracker FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can update usage" ON public.daily_usage_tracker FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
