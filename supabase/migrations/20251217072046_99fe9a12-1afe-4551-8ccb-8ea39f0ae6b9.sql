-- Add subscription date columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone;

-- Update existing trial users to have proper end dates based on trial_end_date
UPDATE public.users 
SET subscription_ends_at = trial_end_date 
WHERE subscription_plan = 'trial' AND trial_end_date IS NOT NULL AND subscription_ends_at IS NULL;

-- Create index for efficient queries on subscription_ends_at
CREATE INDEX IF NOT EXISTS idx_users_subscription_ends_at ON public.users(subscription_ends_at);