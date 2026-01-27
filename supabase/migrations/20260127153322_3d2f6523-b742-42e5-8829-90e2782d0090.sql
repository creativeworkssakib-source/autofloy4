-- Add product_source column to product_media table to separate physical and digital products
ALTER TABLE public.product_media 
ADD COLUMN IF NOT EXISTS product_source TEXT NOT NULL DEFAULT 'physical';

-- Add comment for clarity
COMMENT ON COLUMN public.product_media.product_source IS 'Source type: physical or digital';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_product_media_source ON public.product_media(product_source);
CREATE INDEX IF NOT EXISTS idx_product_media_user_source ON public.product_media(user_id, product_source);