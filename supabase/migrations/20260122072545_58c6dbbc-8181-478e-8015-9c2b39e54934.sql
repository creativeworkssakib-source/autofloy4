-- Add max_facebook_pages column to pricing_plans table for admin control
ALTER TABLE public.pricing_plans 
ADD COLUMN IF NOT EXISTS max_facebook_pages INTEGER DEFAULT 1;

-- Update existing plans with appropriate limits
UPDATE public.pricing_plans SET max_facebook_pages = 10 WHERE id = 'free-trial';
UPDATE public.pricing_plans SET max_facebook_pages = 1 WHERE id = 'starter';
UPDATE public.pricing_plans SET max_facebook_pages = 2 WHERE id = 'professional';
UPDATE public.pricing_plans SET max_facebook_pages = 5 WHERE id = 'business';
UPDATE public.pricing_plans SET max_facebook_pages = 999 WHERE id = 'lifetime';