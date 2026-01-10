-- Add terms_and_conditions column to shop_settings
ALTER TABLE public.shop_settings 
ADD COLUMN terms_and_conditions TEXT DEFAULT NULL;