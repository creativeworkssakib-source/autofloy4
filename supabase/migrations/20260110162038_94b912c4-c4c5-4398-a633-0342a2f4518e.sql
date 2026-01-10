-- Create shop_stock_batches table for tracking individual stock entries
CREATE TABLE public.shop_stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.shop_purchases(id) ON DELETE SET NULL,
  purchase_item_id UUID REFERENCES public.shop_purchase_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  batch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date DATE,
  notes TEXT,
  is_initial_batch BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add average_cost column to shop_products
ALTER TABLE public.shop_products 
ADD COLUMN IF NOT EXISTS average_cost NUMERIC(10,2);

-- Enable RLS on shop_stock_batches
ALTER TABLE public.shop_stock_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shop_stock_batches
CREATE POLICY "Users can view their own stock batches"
ON public.shop_stock_batches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock batches"
ON public.shop_stock_batches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock batches"
ON public.shop_stock_batches
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock batches"
ON public.shop_stock_batches
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_stock_batches_product_id ON public.shop_stock_batches(product_id);
CREATE INDEX idx_stock_batches_shop_id ON public.shop_stock_batches(shop_id);
CREATE INDEX idx_stock_batches_user_id ON public.shop_stock_batches(user_id);
CREATE INDEX idx_stock_batches_batch_date ON public.shop_stock_batches(batch_date);
CREATE INDEX idx_stock_batches_remaining ON public.shop_stock_batches(remaining_quantity) WHERE remaining_quantity > 0;

-- Create trigger for updated_at
CREATE TRIGGER update_shop_stock_batches_updated_at
BEFORE UPDATE ON public.shop_stock_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing products to have initial batches
-- This will be done via edge function after migration is approved