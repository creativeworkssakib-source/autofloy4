-- Add invoice_format column to shop_settings table
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS invoice_format TEXT DEFAULT 'simple' CHECK (invoice_format IN ('simple', 'better'));