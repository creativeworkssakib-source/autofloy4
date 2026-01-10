-- Fix 1: Enable RLS on automations table
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Since this app uses custom JWT auth (not Supabase Auth), auth.uid() returns null
-- Edge functions use service role key which bypasses RLS
-- Deny direct client access via anon key
CREATE POLICY "Deny direct client access to automations" ON public.automations
  FOR ALL USING (false);

-- Fix 2: Enable RLS on connected_accounts table
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- Contains sensitive OAuth tokens - deny direct client access
CREATE POLICY "Deny direct client access to connected accounts" ON public.connected_accounts
  FOR ALL USING (false);