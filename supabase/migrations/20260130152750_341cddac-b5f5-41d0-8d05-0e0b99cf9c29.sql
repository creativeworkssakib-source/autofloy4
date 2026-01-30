-- Add is_suspended column to users table for account suspension
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.users.is_suspended IS 'When true, user is blocked from accessing any features. Set by admin.';