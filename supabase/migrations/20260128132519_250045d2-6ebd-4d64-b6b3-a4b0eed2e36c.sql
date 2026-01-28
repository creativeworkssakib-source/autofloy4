-- Add support WhatsApp number to page_memory for AI to share with customers who need call/urgent support
ALTER TABLE public.page_memory 
ADD COLUMN IF NOT EXISTS support_whatsapp_number TEXT DEFAULT NULL;

-- Add a comment explaining the field
COMMENT ON COLUMN public.page_memory.support_whatsapp_number IS 'WhatsApp number for customer support. AI will share this when customers ask to call or need urgent help.';