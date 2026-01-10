-- Fix 1: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Since this app uses custom JWT auth (not Supabase Auth), auth.uid() returns null
-- The edge functions use service role key which bypasses RLS
-- For direct client access via anon key, we deny all access (service role still works)

-- Users cannot access this table directly via client (service role bypasses RLS)
CREATE POLICY "Deny direct client access to users" ON public.users
  FOR ALL USING (false);

-- Fix 2: Drop and recreate overly permissive OTP policies
DROP POLICY IF EXISTS "Users can insert their own OTPs" ON public.verification_otps;
DROP POLICY IF EXISTS "Users can delete their own OTPs" ON public.verification_otps;
DROP POLICY IF EXISTS "Users can view their own OTPs" ON public.verification_otps;

-- OTPs are managed via edge functions with service role, deny direct client access
CREATE POLICY "Deny direct client access to OTPs" ON public.verification_otps
  FOR ALL USING (false);