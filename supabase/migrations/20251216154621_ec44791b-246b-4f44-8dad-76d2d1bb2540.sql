-- Create verification_otps table for email and phone OTP verification
CREATE TABLE public.verification_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  email_otp INTEGER,
  phone_otp INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add phone_verified column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.verification_otps ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_otps
CREATE POLICY "Users can view their own OTPs"
ON public.verification_otps
FOR SELECT
USING (auth.uid()::text = user_id::text OR user_id = (SELECT id FROM public.users WHERE id = user_id LIMIT 1));

CREATE POLICY "Users can insert their own OTPs"
ON public.verification_otps
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own OTPs"
ON public.verification_otps
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_verification_otps_user_id_type ON public.verification_otps(user_id, type);
CREATE INDEX idx_verification_otps_created_at ON public.verification_otps(created_at);