-- Create page_memory table to store AI context for each connected Facebook page
CREATE TABLE public.page_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  
  -- Business analysis
  business_type TEXT,
  business_category TEXT,
  detected_language TEXT DEFAULT 'auto',
  preferred_tone TEXT DEFAULT 'friendly',
  
  -- AI Context
  business_description TEXT,
  products_summary TEXT,
  faq_context TEXT,
  custom_instructions TEXT,
  
  -- Webhook configuration
  webhook_subscribed BOOLEAN DEFAULT false,
  webhook_subscribed_at TIMESTAMP WITH TIME ZONE,
  
  -- Automation settings (synced from frontend)
  automation_settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one memory entry per page per user
  UNIQUE(user_id, page_id)
);

-- Enable RLS
ALTER TABLE public.page_memory ENABLE ROW LEVEL SECURITY;

-- RLS policy - deny direct client access (managed via edge functions)
CREATE POLICY "Deny direct client access to page_memory"
  ON public.page_memory
  FOR ALL
  USING (false);

-- Index for faster lookups
CREATE INDEX idx_page_memory_user_page ON public.page_memory(user_id, page_id);
CREATE INDEX idx_page_memory_account ON public.page_memory(account_id);

-- Trigger to update updated_at
CREATE TRIGGER update_page_memory_updated_at
  BEFORE UPDATE ON public.page_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();