-- Add auth_provider and google_id columns to users table for Google OAuth
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Create index for faster Google user lookup
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON public.users(auth_provider);