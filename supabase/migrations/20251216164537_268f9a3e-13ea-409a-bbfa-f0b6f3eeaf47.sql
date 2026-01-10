-- Add encrypted columns for tokens
ALTER TABLE public.connected_accounts 
ADD COLUMN IF NOT EXISTS access_token_encrypted text,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
ADD COLUMN IF NOT EXISTS encryption_version integer DEFAULT 1;