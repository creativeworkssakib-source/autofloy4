-- Create shop_returns table for tracking product returns
CREATE TABLE public.shop_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  customer_id UUID REFERENCES public.shop_customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  return_reason TEXT NOT NULL,
  return_date DATE DEFAULT CURRENT_DATE,
  refund_amount NUMERIC DEFAULT 0,
  notes TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_returns ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - deny direct client access (use edge functions)
CREATE POLICY "Deny direct client access to shop_returns" 
ON public.shop_returns 
FOR ALL 
USING (false);

-- Create storage bucket for return photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('return-photos', 'return-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for return photos
CREATE POLICY "Anyone can view return photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'return-photos');

CREATE POLICY "Authenticated users can upload return photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'return-photos');

CREATE POLICY "Users can update their return photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'return-photos');

CREATE POLICY "Users can delete their return photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'return-photos');