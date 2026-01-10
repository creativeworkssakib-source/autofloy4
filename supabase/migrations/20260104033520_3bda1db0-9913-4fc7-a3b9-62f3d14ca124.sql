-- Create trash bin table for soft deletes
CREATE TABLE public.shop_trash (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  original_table TEXT NOT NULL,
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  restored_at TIMESTAMP WITH TIME ZONE,
  permanently_deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shop_trash ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Deny direct client access to shop_trash" 
ON public.shop_trash 
FOR ALL 
USING (false);

-- Create purchase payment history table
CREATE TABLE public.shop_purchase_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  purchase_id UUID NOT NULL REFERENCES public.shop_purchases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_purchase_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Deny direct client access to shop_purchase_payments" 
ON public.shop_purchase_payments 
FOR ALL 
USING (false);

-- Create index for faster queries
CREATE INDEX idx_shop_trash_user_id ON public.shop_trash(user_id);
CREATE INDEX idx_shop_trash_expires_at ON public.shop_trash(expires_at);
CREATE INDEX idx_shop_trash_original_table ON public.shop_trash(original_table);
CREATE INDEX idx_shop_purchase_payments_purchase_id ON public.shop_purchase_payments(purchase_id);
CREATE INDEX idx_shop_purchase_payments_user_id ON public.shop_purchase_payments(user_id);