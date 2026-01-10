-- Create supplier returns table for tracking products returned to suppliers
CREATE TABLE public.shop_supplier_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.shop_suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  purchase_id UUID REFERENCES public.shop_purchases(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  return_reason TEXT NOT NULL,
  return_date DATE DEFAULT CURRENT_DATE,
  refund_amount NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_supplier_returns ENABLE ROW LEVEL SECURITY;

-- Deny direct client access (use edge functions)
CREATE POLICY "Deny direct client access to shop_supplier_returns"
ON public.shop_supplier_returns
FOR ALL
USING (false);

-- Create index for faster queries
CREATE INDEX idx_shop_supplier_returns_user_id ON public.shop_supplier_returns(user_id);
CREATE INDEX idx_shop_supplier_returns_supplier_id ON public.shop_supplier_returns(supplier_id);
CREATE INDEX idx_shop_supplier_returns_return_date ON public.shop_supplier_returns(return_date);

-- Add trigger for updated_at
CREATE TRIGGER update_shop_supplier_returns_updated_at
BEFORE UPDATE ON public.shop_supplier_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();