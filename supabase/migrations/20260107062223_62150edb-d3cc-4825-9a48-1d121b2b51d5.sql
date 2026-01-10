-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view webhook configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Admins can insert webhook configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Admins can update webhook configs" ON public.webhook_configs;
DROP POLICY IF EXISTS "Admins can delete webhook configs" ON public.webhook_configs;

-- Create new policies that allow public read (for admin panel which uses service role)
-- and admin-only write access
CREATE POLICY "Anyone can read webhook configs"
ON public.webhook_configs
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage webhook configs"
ON public.webhook_configs
FOR ALL
USING (true)
WITH CHECK (true);