-- Fix existing users with 'none' plan - set them to expired trial
UPDATE users 
SET subscription_plan = 'trial', 
    is_trial_active = false, 
    trial_end_date = NOW() 
WHERE subscription_plan = 'none';