-- Add explicit deny policy for api_integrations table
-- This ensures no direct client access to platform API keys
-- Edge functions with service role key will still bypass RLS

CREATE POLICY "Deny direct client access to api_integrations"
ON public.api_integrations
FOR ALL
USING (false)
WITH CHECK (false);

-- Add a comment explaining the security design
COMMENT ON TABLE public.api_integrations IS 'Platform-wide API keys. All access through edge functions only. Direct client access denied via RLS policy.';