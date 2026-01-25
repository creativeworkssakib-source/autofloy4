-- Add is_active column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing users to be active
UPDATE public.users SET is_active = true WHERE is_active IS NULL;