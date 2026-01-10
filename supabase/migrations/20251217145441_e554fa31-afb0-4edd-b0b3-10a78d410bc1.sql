-- Create product_variants table for size, color, etc.
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  price_adjustment numeric DEFAULT 0,
  stock_quantity integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policy: Deny direct client access (use edge functions)
CREATE POLICY "Deny direct client access to product_variants"
ON public.product_variants
AS RESTRICTIVE
FOR ALL
USING (false);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_user ON public.product_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(user_id, sku);

-- Trigger for updated_at
CREATE TRIGGER update_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();