-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id::text = auth.uid()::text AND role = 'admin'));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Service role can insert notifications
CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'bn',
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT true,
  trash_passcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Service role full access
CREATE POLICY "Service role can manage user_settings" ON public.user_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Create verification_otps table for email/phone verification
CREATE TABLE IF NOT EXISTS public.verification_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  otp_code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_otps_email ON public.verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_verification_otps_phone ON public.verification_otps(phone);
CREATE INDEX IF NOT EXISTS idx_verification_otps_expires_at ON public.verification_otps(expires_at);

-- Enable RLS
ALTER TABLE public.verification_otps ENABLE ROW LEVEL SECURITY;

-- Service role full access (OTPs are managed by edge functions)
CREATE POLICY "Service role can manage otps" ON public.verification_otps
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for user_settings updated_at
CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_user_settings_timestamp
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_settings_updated_at();