-- Create message batching table for AI conversations
CREATE TABLE IF NOT EXISTS public.ai_message_buffer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_ai_message_buffer_lookup ON public.ai_message_buffer(page_id, sender_id, is_processed);

-- Auto-delete old processed buffers after 1 hour
CREATE INDEX idx_ai_message_buffer_cleanup ON public.ai_message_buffer(created_at) WHERE is_processed = true;

-- Enable RLS
ALTER TABLE public.ai_message_buffer ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.ai_message_buffer
FOR ALL USING (true);

COMMENT ON TABLE public.ai_message_buffer IS 'Temporary buffer for batching consecutive messages from same customer before AI processing';