-- Create table for tracking product addition history
CREATE TABLE public.shop_product_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity_added INTEGER NOT NULL DEFAULT 0,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  action_type TEXT NOT NULL DEFAULT 'added',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shop_product_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own product history" 
ON public.shop_product_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product history" 
ON public.shop_product_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product history" 
ON public.shop_product_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_shop_product_history_user_id ON public.shop_product_history(user_id);
CREATE INDEX idx_shop_product_history_shop_id ON public.shop_product_history(shop_id);
CREATE INDEX idx_shop_product_history_created_at ON public.shop_product_history(created_at);