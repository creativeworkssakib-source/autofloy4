-- Add online/offline business toggle fields to site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS online_business_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS offline_shop_enabled BOOLEAN DEFAULT true;

-- Update existing row with defaults
UPDATE public.site_settings 
SET online_business_enabled = true, offline_shop_enabled = true
WHERE id = '00000000-0000-0000-0000-000000000001';