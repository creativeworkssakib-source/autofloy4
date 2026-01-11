-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Only admins can view full site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can insert site settings" ON public.site_settings;

-- Recreate all admin-only policies for site_settings
CREATE POLICY "Only admins can view full site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));