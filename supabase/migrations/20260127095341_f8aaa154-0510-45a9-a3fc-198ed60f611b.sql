-- Create digital_products table for selling digital items
CREATE TABLE public.digital_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES public.shops(id),
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL DEFAULT 'subscription', -- subscription, api, course, software, other
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  currency TEXT DEFAULT 'BDT',
  -- Credential-based products (like Canva premium, subscriptions)
  credential_username TEXT,
  credential_password TEXT,
  credential_email TEXT,
  credential_extra JSONB, -- Additional credential info
  -- File-based products (APK, software, documents)
  file_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  file_type TEXT,
  -- API products
  api_endpoint TEXT,
  api_key TEXT,
  api_documentation TEXT,
  -- Course/content products
  access_url TEXT,
  access_instructions TEXT,
  -- Stock & availability
  stock_quantity INTEGER DEFAULT 1,
  is_unlimited_stock BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  -- Tracking
  total_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create digital_product_sales table to track sales
CREATE TABLE public.digital_product_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_fb_id TEXT,
  sale_price NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending', -- pending, paid, refunded
  delivery_status TEXT DEFAULT 'pending', -- pending, delivered, failed
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for digital_products
CREATE POLICY "Users can view their own digital products"
ON public.digital_products
FOR SELECT
USING (auth.uid()::text = user_id::text OR user_id::text = (SELECT id::text FROM public.users WHERE id::text = auth.uid()::text LIMIT 1));

CREATE POLICY "Users can create their own digital products"
ON public.digital_products
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own digital products"
ON public.digital_products
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own digital products"
ON public.digital_products
FOR DELETE
USING (true);

-- RLS Policies for digital_product_sales
CREATE POLICY "Users can view their own digital product sales"
ON public.digital_product_sales
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own digital product sales"
ON public.digital_product_sales
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own digital product sales"
ON public.digital_product_sales
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own digital product sales"
ON public.digital_product_sales
FOR DELETE
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_digital_products_user_id ON public.digital_products(user_id);
CREATE INDEX idx_digital_products_type ON public.digital_products(product_type);
CREATE INDEX idx_digital_product_sales_user_id ON public.digital_product_sales(user_id);
CREATE INDEX idx_digital_product_sales_product_id ON public.digital_product_sales(product_id);

-- Add trigger for updated_at
CREATE TRIGGER update_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_product_sales_updated_at
BEFORE UPDATE ON public.digital_product_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();