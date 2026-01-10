-- Create user_settings table for automation settings and notification preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Automation settings
  default_tone TEXT NOT NULL DEFAULT 'friendly',
  response_language TEXT NOT NULL DEFAULT 'bengali',
  -- Notification preferences
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_alerts BOOLEAN NOT NULL DEFAULT false,
  daily_digest BOOLEAN NOT NULL DEFAULT true,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - deny direct client access (use edge function)
CREATE POLICY "Deny direct client access to user_settings"
ON public.user_settings
FOR ALL
USING (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();