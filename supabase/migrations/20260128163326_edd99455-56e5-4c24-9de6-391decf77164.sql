-- Add subscription_type to users table to track what type of subscription they bought
-- Values: 'online', 'offline', 'both'
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT 'online' 
CHECK (subscription_type IN ('online', 'offline', 'both'));

-- Add comment for documentation
COMMENT ON COLUMN public.users.subscription_type IS 'Type of subscription: online (Facebook/WhatsApp automation), offline (Shop POS system), both (complete bundle)';