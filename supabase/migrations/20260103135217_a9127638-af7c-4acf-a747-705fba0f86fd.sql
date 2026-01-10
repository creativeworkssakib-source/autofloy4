-- Create sync_settings table for storing online/offline sync preferences
CREATE TABLE public.sync_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sync_enabled boolean NOT NULL DEFAULT false,
  master_inventory text NOT NULL DEFAULT 'offline',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on sync_settings
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

-- Deny direct client access (handled via edge functions)
CREATE POLICY "Deny direct client access to sync_settings"
ON public.sync_settings FOR ALL
USING (false);

-- Create sync_logs table for tracking sync events
CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text NOT NULL,
  source_id uuid,
  target text,
  target_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Deny direct client access (handled via edge functions)
CREATE POLICY "Deny direct client access to sync_logs"
ON public.sync_logs FOR ALL
USING (false);

-- Add online_sku field to shop_products for linking with online products
ALTER TABLE public.shop_products
ADD COLUMN IF NOT EXISTS online_sku text;

-- Add source field to shop_sales to track if sale originated online or offline
ALTER TABLE public.shop_sales
ADD COLUMN IF NOT EXISTS source text DEFAULT 'offline';

-- Add index for online_sku for faster lookups
CREATE INDEX IF NOT EXISTS idx_shop_products_online_sku ON public.shop_products(online_sku) WHERE online_sku IS NOT NULL;

-- Create trigger for updating sync_settings updated_at
CREATE TRIGGER update_sync_settings_updated_at
BEFORE UPDATE ON public.sync_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();