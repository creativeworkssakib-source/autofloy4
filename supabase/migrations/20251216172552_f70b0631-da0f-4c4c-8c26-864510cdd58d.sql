-- Drop the existing check constraint and add a new one that includes 'password_reset'
ALTER TABLE public.verification_otps DROP CONSTRAINT IF EXISTS verification_otps_type_check;

ALTER TABLE public.verification_otps ADD CONSTRAINT verification_otps_type_check 
CHECK (type IN ('email', 'phone', 'password_reset'));