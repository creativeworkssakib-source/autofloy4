-- Add Google and Bing verification fields to seo_settings
ALTER TABLE public.seo_settings 
ADD COLUMN IF NOT EXISTS google_verification_code TEXT,
ADD COLUMN IF NOT EXISTS bing_verification_code TEXT,
ADD COLUMN IF NOT EXISTS custom_head_scripts TEXT;

-- Add SEO fields to cms_pages for per-page SEO
ALTER TABLE public.cms_pages
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Add SEO fields to blog_posts for per-post SEO  
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS canonical_url TEXT;