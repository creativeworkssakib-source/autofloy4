-- Add support_whatsapp_number to users table for global use across all platforms
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS support_whatsapp_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.support_whatsapp_number IS 'Global support WhatsApp number used by AI across all platforms (Facebook, Instagram, WhatsApp)';