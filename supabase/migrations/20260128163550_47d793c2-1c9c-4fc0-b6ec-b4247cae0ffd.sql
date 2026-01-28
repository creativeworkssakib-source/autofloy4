-- Add subscription_type to payment_requests to track what type of subscription user is buying
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'online' 
CHECK (subscription_type IN ('online', 'offline', 'both'));

COMMENT ON COLUMN public.payment_requests.subscription_type IS 'Type of subscription being purchased: online, offline, or both';