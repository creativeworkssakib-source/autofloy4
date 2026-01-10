-- Add size and color columns to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS color text;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON public.product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON public.product_variants(color);