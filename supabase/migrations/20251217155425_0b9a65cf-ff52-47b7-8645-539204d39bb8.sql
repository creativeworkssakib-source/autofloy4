-- Add brand column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;

-- Create index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

-- Create index for category filtering  
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);