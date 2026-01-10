-- Fix security: Admin update policies should check user role properly

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admin update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admin update appearance_settings" ON appearance_settings;
DROP POLICY IF EXISTS "Admin update seo_settings" ON seo_settings;

-- Create proper admin-only update policies using has_role function if it exists
-- First, let's create a simpler approach: only allow specific admin user IDs

-- For now, allow authenticated users with admin role to update
-- Since these are typically single-row settings tables that only admins edit via edge functions,
-- We can restrict updates to require admin role check

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Site settings: only admins can update
CREATE POLICY "Admin update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Appearance settings: only admins can update
CREATE POLICY "Admin update appearance_settings"
ON public.appearance_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- SEO settings: only admins can update
CREATE POLICY "Admin update seo_settings"
ON public.seo_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';