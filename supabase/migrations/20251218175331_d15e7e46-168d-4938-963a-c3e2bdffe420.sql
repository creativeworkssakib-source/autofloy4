-- Add trial_started_at column to users table for complete trial tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT now();

-- Update existing users: set trial_started_at to created_at if they have a trial
UPDATE public.users 
SET trial_started_at = created_at 
WHERE trial_started_at IS NULL AND is_trial_active = true;