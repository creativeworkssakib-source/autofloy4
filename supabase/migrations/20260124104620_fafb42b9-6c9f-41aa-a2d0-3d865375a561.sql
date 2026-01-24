-- Create facebook_posts table to store post data with product links
CREATE TABLE public.facebook_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  post_text TEXT,
  media_type TEXT, -- 'photo', 'video', 'album', 'link', 'status'
  media_url TEXT,
  thumbnail_url TEXT,
  linked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_detected_name TEXT, -- AI detected product name from post
  is_synced BOOLEAN DEFAULT true,
  engagement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_id, post_id)
);

-- Enable RLS
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own facebook posts"
ON public.facebook_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facebook posts"
ON public.facebook_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facebook posts"
ON public.facebook_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facebook posts"
ON public.facebook_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_facebook_posts_page_post ON public.facebook_posts(page_id, post_id);
CREATE INDEX idx_facebook_posts_product ON public.facebook_posts(linked_product_id);

-- Add trigger for updated_at
CREATE TRIGGER update_facebook_posts_updated_at
BEFORE UPDATE ON public.facebook_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();