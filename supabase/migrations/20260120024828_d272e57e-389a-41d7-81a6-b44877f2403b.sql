-- Add tax_percent column to shop_products table
ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.shop_products.tax_percent IS 'Tax percentage to be applied during sale (e.g., 5 for 5%)';