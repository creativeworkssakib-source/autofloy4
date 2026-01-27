-- Create product_media table for storing photos/videos linked to products
CREATE TABLE public.product_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  thumbnail_url TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own product media"
ON public.product_media FOR SELECT
USING (auth.uid()::text = user_id::text OR EXISTS (
  SELECT 1 FROM public.users WHERE id = product_media.user_id
));

CREATE POLICY "Users can insert their own product media"
ON public.product_media FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own product media"
ON public.product_media FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own product media"
ON public.product_media FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_product_media_product_id ON public.product_media(product_id);
CREATE INDEX idx_product_media_user_id ON public.product_media(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_product_media_updated_at
BEFORE UPDATE ON public.product_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product media if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-media', 'product-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-media bucket
CREATE POLICY "Anyone can view product media"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

CREATE POLICY "Authenticated users can upload product media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Users can update their own product media files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-media');

CREATE POLICY "Users can delete their own product media files"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-media');