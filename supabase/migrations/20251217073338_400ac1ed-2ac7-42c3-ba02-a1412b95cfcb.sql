-- Fix existing users with paid plans that have null subscription dates
UPDATE users 
SET subscription_started_at = COALESCE(created_at, NOW()), 
    subscription_ends_at = COALESCE(created_at, NOW()) + INTERVAL '30 days'
WHERE subscription_plan IN ('starter', 'professional', 'business') 
  AND subscription_ends_at IS NULL;