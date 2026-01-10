-- Create table for storing admin-configured API integrations
CREATE TABLE public.api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,
  api_key TEXT,
  api_secret TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment describing the table
COMMENT ON TABLE public.api_integrations IS 'Admin-configured third-party API keys for platform-wide features';

-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write (via edge functions with service role)
-- No direct RLS policies needed as all access will be through edge functions

-- Create trigger for updated_at
CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON public.api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default providers
INSERT INTO public.api_integrations (provider, is_enabled, config) VALUES
  ('apify', false, '{"description": "Web scraping and automation platform for lead generation"}'),
  ('firecrawl', false, '{"description": "AI-powered web scraping API for extracting structured data"}'),
  ('google_maps', false, '{"description": "Google Maps API for business location search"}'),
  ('openai', false, '{"description": "OpenAI API for AI-powered features"}')
ON CONFLICT (provider) DO NOTHING;