-- Fix the qxyear@gmail.com user's trial status
UPDATE users 
SET 
  is_trial_active = true,
  trial_end_date = NOW() + INTERVAL '24 hours',
  subscription_started_at = NOW(),
  subscription_ends_at = NOW() + INTERVAL '24 hours'
WHERE email = 'qxyear@gmail.com';