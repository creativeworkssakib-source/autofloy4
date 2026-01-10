-- Fix overly permissive RLS policy for users insert
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create proper insert policy that only allows inserting with matching user id
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id::text = current_setting('request.jwt.claims', true)::json->>'sub');