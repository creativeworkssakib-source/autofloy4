-- Force schema cache refresh
-- This migration refreshes the schema cache by touching a table

-- Ensure all settings tables have proper SELECT policies for anonymous users
DROP POLICY IF EXISTS "Public read access for site_settings" ON site_settings;
CREATE POLICY "Public read access for site_settings"
ON site_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read access for appearance_settings" ON appearance_settings;
CREATE POLICY "Public read access for appearance_settings"
ON appearance_settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read access for seo_settings" ON seo_settings;
CREATE POLICY "Public read access for seo_settings"
ON seo_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';