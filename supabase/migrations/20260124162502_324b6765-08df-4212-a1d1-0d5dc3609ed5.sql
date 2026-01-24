-- Add customer_summary field to store compact summary instead of full history
ALTER TABLE public.ai_conversations 
ADD COLUMN IF NOT EXISTS customer_summary TEXT,
ADD COLUMN IF NOT EXISTS last_products_discussed TEXT[],
ADD COLUMN IF NOT EXISTS total_messages_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_ordered_before BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_preferences JSONB DEFAULT '{}';

-- Add comment to explain the fields
COMMENT ON COLUMN public.ai_conversations.customer_summary IS 'Compact summary of conversation history to avoid storing all messages';
COMMENT ON COLUMN public.ai_conversations.last_products_discussed IS 'Array of product names discussed with this customer';
COMMENT ON COLUMN public.ai_conversations.total_messages_count IS 'Total number of messages exchanged (even if history is trimmed)';
COMMENT ON COLUMN public.ai_conversations.has_ordered_before IS 'Whether customer has placed an order before';
COMMENT ON COLUMN public.ai_conversations.customer_preferences IS 'JSON object storing customer preferences (budget, preferred brands, etc.)';