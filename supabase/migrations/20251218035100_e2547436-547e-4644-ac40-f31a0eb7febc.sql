-- Create rate limiting table for authentication endpoints
CREATE TABLE public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_auth_rate_limits_identifier_endpoint 
ON public.auth_rate_limits(identifier, endpoint);

-- Create index for cleanup of old records
CREATE INDEX idx_auth_rate_limits_window_start 
ON public.auth_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions use service role)
-- No user-facing policies needed