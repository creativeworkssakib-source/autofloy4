-- Add has_used_trial column to track if user has ever used trial
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS has_used_trial boolean NOT NULL DEFAULT false;

-- Set has_used_trial = true for existing users who have/had trial
UPDATE public.users 
SET has_used_trial = true 
WHERE subscription_plan = 'trial' 
   OR trial_started_at IS NOT NULL 
   OR trial_end_date IS NOT NULL;