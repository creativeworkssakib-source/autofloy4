-- Sync is_suspended flag for all currently suspended users
UPDATE public.users 
SET is_suspended = true 
WHERE status = 'suspended' AND (is_suspended IS NULL OR is_suspended = false);

-- Also ensure active users have is_suspended = false
UPDATE public.users 
SET is_suspended = false 
WHERE status = 'active' AND (is_suspended IS NULL OR is_suspended = true);