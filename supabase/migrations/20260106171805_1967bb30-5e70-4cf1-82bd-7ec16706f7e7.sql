-- Create SMS usage logs table to track daily usage
CREATE TABLE public.sms_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sms_count INTEGER NOT NULL DEFAULT 1,
  sms_type TEXT NOT NULL, -- 'due_reminder' | 'followup'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient daily usage queries
CREATE INDEX idx_sms_usage_user_date ON public.sms_usage_logs(user_id, sent_at);

-- Enable RLS
ALTER TABLE public.sms_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own SMS logs
CREATE POLICY "Users can view their own SMS logs"
ON public.sms_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only backend (service role) can insert logs
CREATE POLICY "Service role can insert SMS logs"
ON public.sms_usage_logs
FOR INSERT
WITH CHECK (true);

-- Add SMS limit columns to site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS sms_limit_trial INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_limit_starter INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS sms_limit_professional INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS sms_limit_business INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS sms_limit_lifetime INTEGER DEFAULT -1;