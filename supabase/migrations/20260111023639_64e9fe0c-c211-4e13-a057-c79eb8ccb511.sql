-- Add missing password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

-- Create auth_rate_limits table for rate limiting
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_usage_history table for trial abuse prevention
CREATE TABLE IF NOT EXISTS public.email_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  trial_used BOOLEAN DEFAULT false,
  last_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outgoing_events table for webhooks
CREATE TABLE IF NOT EXISTS public.outgoing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.auth_rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.auth_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_outgoing_events_status ON public.outgoing_events(status);

-- Create can_email_use_trial function
CREATE OR REPLACE FUNCTION public.can_email_use_trial(p_email TEXT)
RETURNS TABLE(can_use_trial BOOLEAN, is_returning_user BOOLEAN, last_plan TEXT) AS $$
DECLARE
  v_history RECORD;
BEGIN
  SELECT * INTO v_history 
  FROM public.email_usage_history 
  WHERE LOWER(email) = LOWER(p_email);
  
  IF v_history IS NULL THEN
    RETURN QUERY SELECT true, false, 'free'::TEXT;
  ELSE
    RETURN QUERY SELECT NOT v_history.trial_used, true, COALESCE(v_history.last_plan, 'free');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on new tables
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_events ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access auth_rate_limits" ON public.auth_rate_limits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access email_usage_history" ON public.email_usage_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access outgoing_events" ON public.outgoing_events
  FOR ALL USING (true) WITH CHECK (true);