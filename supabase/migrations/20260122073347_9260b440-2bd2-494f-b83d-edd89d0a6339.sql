-- Add picture_url column to connected_accounts table
ALTER TABLE public.connected_accounts 
ADD COLUMN IF NOT EXISTS picture_url TEXT;