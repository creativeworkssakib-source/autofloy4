-- Add missing columns to user_settings table
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS default_tone TEXT DEFAULT 'friendly',
  ADD COLUMN IF NOT EXISTS response_language TEXT DEFAULT 'bengali',
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sound_alerts BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_digest BOOLEAN DEFAULT true;

-- Add missing columns to notifications table
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Rename otp_code to email_otp in verification_otps table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'verification_otps' 
             AND column_name = 'otp_code') THEN
    ALTER TABLE public.verification_otps RENAME COLUMN otp_code TO email_otp;
  END IF;
END $$;

-- Add phone_otp column if needed
ALTER TABLE public.verification_otps 
  ADD COLUMN IF NOT EXISTS phone_otp TEXT;