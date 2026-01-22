-- Add category column to connected_accounts table for Facebook page categories
ALTER TABLE public.connected_accounts 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_connected_accounts_category 
ON public.connected_accounts(category);

-- Add comment for documentation
COMMENT ON COLUMN public.connected_accounts.category IS 'Facebook page category (e.g., E-commerce, Local Business)';