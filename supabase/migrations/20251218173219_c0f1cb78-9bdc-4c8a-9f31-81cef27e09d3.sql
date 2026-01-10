-- Fix 1: Add RLS policy to auth_rate_limits (deny direct client access - only service role should access)
CREATE POLICY "Deny direct client access to auth_rate_limits"
ON public.auth_rate_limits
FOR ALL
USING (false);

-- Fix 2: Update update_site_settings_updated_at function to set search_path
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;