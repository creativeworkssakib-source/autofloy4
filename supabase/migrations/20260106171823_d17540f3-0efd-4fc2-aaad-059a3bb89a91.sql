-- Fix: Drop the overly permissive INSERT policy and make it more secure
-- Only service role (backend) should be able to insert, not any authenticated user
DROP POLICY IF EXISTS "Service role can insert SMS logs" ON public.sms_usage_logs;

-- No public INSERT policy needed - service_role bypasses RLS automatically
-- This is the intended design: only edge functions with service_role can insert