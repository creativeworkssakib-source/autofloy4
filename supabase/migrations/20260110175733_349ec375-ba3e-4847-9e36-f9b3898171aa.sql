-- Create table for scanner devices
CREATE TABLE public.shop_scanner_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'keyboard',
  vendor_id TEXT,
  product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  total_scans INTEGER DEFAULT 0,
  avg_scan_speed NUMERIC(10,2) DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_scanner_devices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scanner devices" 
ON public.shop_scanner_devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scanner devices" 
ON public.shop_scanner_devices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scanner devices" 
ON public.shop_scanner_devices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanner devices" 
ON public.shop_scanner_devices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for timestamp updates
CREATE TRIGGER update_shop_scanner_devices_updated_at
BEFORE UPDATE ON public.shop_scanner_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_shop_scanner_devices_user_shop ON public.shop_scanner_devices(user_id, shop_id);
CREATE INDEX idx_shop_scanner_devices_active ON public.shop_scanner_devices(is_active) WHERE is_active = true;