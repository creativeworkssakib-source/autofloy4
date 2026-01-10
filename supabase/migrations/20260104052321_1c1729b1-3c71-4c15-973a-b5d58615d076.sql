-- Add trash_passcode to shop_settings for instant delete feature
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS trash_passcode_hash text DEFAULT NULL;

-- Update shop_trash default expiry from 30 days to 7 days
ALTER TABLE public.shop_trash 
ALTER COLUMN expires_at SET DEFAULT (now() + '7 days'::interval);