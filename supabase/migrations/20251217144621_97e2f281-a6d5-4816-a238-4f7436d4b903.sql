-- Add category and stock_quantity columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS stock_quantity integer;

-- Create product_categories table for user-defined categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policy: Deny direct client access (use edge functions)
CREATE POLICY "Deny direct client access to product_categories"
ON public.product_categories
AS RESTRICTIVE
FOR ALL
USING (false);

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_products_user_category ON public.products(user_id, category);
CREATE INDEX IF NOT EXISTS idx_products_user_sku ON public.products(user_id, sku);