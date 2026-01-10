-- Fix user_roles table RLS policy - users should only see their own role
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Fix site_settings table - only admins should be able to update
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON public.site_settings;

CREATE POLICY "Only admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));