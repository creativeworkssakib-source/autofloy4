-- Add shop_id column to shop_trash table for multi-shop support
ALTER TABLE public.shop_trash 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;

-- Create index for faster shop-specific queries
CREATE INDEX idx_shop_trash_shop_id ON public.shop_trash(shop_id);

-- Update existing trash items to use shop_id from the data JSON if available
UPDATE public.shop_trash 
SET shop_id = (data->>'shop_id')::UUID 
WHERE shop_id IS NULL 
AND data->>'shop_id' IS NOT NULL 
AND data->>'shop_id' != '';