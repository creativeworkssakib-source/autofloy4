-- Add unique constraint for connected_accounts to enable upsert
CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_unique_page 
ON public.connected_accounts (user_id, platform, external_id);