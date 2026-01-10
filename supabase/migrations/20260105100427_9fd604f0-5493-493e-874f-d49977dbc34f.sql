-- Add new fields to shop_suppliers
ALTER TABLE public.shop_suppliers
ADD COLUMN IF NOT EXISTS supplier_code text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'local';

-- Create unique constraint for supplier_code per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_suppliers_code_user 
ON public.shop_suppliers(user_id, supplier_code) WHERE supplier_code IS NOT NULL;

-- Create supplier payments table for tracking due payments
CREATE TABLE IF NOT EXISTS public.shop_supplier_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  supplier_id uuid NOT NULL REFERENCES public.shop_suppliers(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.shop_purchases(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  payment_date timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on shop_supplier_payments
ALTER TABLE public.shop_supplier_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for shop_supplier_payments
CREATE POLICY "Deny direct client access to shop_supplier_payments" 
ON public.shop_supplier_payments 
FOR ALL 
USING (false);

-- Add transport/landing cost fields to shop_purchases
ALTER TABLE public.shop_purchases
ADD COLUMN IF NOT EXISTS transport_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS landing_cost numeric DEFAULT 0;

-- Create function to generate supplier code
CREATE OR REPLACE FUNCTION generate_supplier_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
  new_code text;
BEGIN
  -- Get the count of suppliers for this user
  SELECT COUNT(*) + 1 INTO next_num
  FROM shop_suppliers
  WHERE user_id = p_user_id;
  
  -- Generate code like SUP-001, SUP-002, etc.
  new_code := 'SUP-' || LPAD(next_num::text, 3, '0');
  
  RETURN new_code;
END;
$$;

-- Create index for faster supplier queries
CREATE INDEX IF NOT EXISTS idx_shop_supplier_payments_supplier ON public.shop_supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shop_supplier_payments_user ON public.shop_supplier_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_supplier ON public.shop_purchases(supplier_id);

-- Update existing suppliers to have supplier codes using a subquery approach
UPDATE public.shop_suppliers s
SET supplier_code = 'SUP-' || LPAD(sub.rn::text, 3, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.shop_suppliers
  WHERE supplier_code IS NULL
) sub
WHERE s.id = sub.id AND s.supplier_code IS NULL;