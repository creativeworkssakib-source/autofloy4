-- Add column to control if user can sync offline and online business
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS can_sync_business boolean NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.users.can_sync_business IS 'Admin-controlled permission allowing user to sync offline and online business';