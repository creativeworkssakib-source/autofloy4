-- Add payment gateway fields to payment_methods table
ALTER TABLE public.payment_methods 
ADD COLUMN IF NOT EXISTS gateway_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_secret TEXT DEFAULT NULL;