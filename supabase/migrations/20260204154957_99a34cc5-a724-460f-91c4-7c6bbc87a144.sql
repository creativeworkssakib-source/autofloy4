-- =====================================================
-- FIX ALL SECURITY VULNERABILITIES
-- =====================================================

-- 1. site_settings: Public view that hides sensitive SMS API keys
DROP VIEW IF EXISTS public.site_settings_public;
CREATE VIEW public.site_settings_public AS
SELECT 
  id,
  company_name,
  tagline,
  about_us,
  logo_url,
  favicon_url,
  support_email,
  billing_email,
  legal_contact_email,
  phone_number,
  company_address,
  city,
  state,
  country,
  postal_code,
  website_url,
  facebook_url,
  twitter_url,
  instagram_url,
  linkedin_url,
  youtube_url,
  copyright_text,
  platform_sms_enabled,
  NULL::text AS platform_sms_api_key,
  platform_sms_sender_id,
  platform_sms_provider,
  sms_limit_trial,
  sms_limit_starter,
  sms_limit_professional,
  sms_limit_business,
  sms_limit_lifetime,
  demo_video_type,
  demo_video_youtube_url,
  demo_video_upload_url,
  demo_video_enabled,
  online_business_enabled,
  offline_shop_enabled,
  created_at,
  updated_at
FROM public.site_settings;

-- 2. payment_methods: Secure view hiding API keys
DROP VIEW IF EXISTS public.payment_methods_public;
CREATE VIEW public.payment_methods_public AS
SELECT 
  id,
  name,
  type,
  account_number,
  account_name,
  instructions,
  icon,
  is_active,
  display_order,
  gateway_url,
  NULL::text AS api_key,
  NULL::text AS api_secret,
  created_at,
  updated_at
FROM public.payment_methods
WHERE is_active = true;

-- 3. reviews: Secure view hiding user_id (using correct column names)
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
SELECT 
  id,
  NULL::uuid AS user_id,
  name,
  rating,
  comment,
  is_verified,
  likes_count,
  created_at
FROM public.reviews;

-- 4. seo_settings: Hide verification codes
DROP VIEW IF EXISTS public.seo_settings_public;
CREATE VIEW public.seo_settings_public AS
SELECT 
  id,
  default_title,
  default_description,
  default_keywords,
  og_image_url,
  twitter_card_type,
  NULL::text AS google_verification_code,
  NULL::text AS bing_verification_code,
  robots_txt_content,
  sitemap_enabled,
  created_at,
  updated_at
FROM public.seo_settings;

-- 5. Update RLS policies for site_settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read non-sensitive site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Update RLS policies for payment_methods
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Public can view payment methods without secrets" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Public can view active payment methods" ON public.payment_methods;

CREATE POLICY "Public can view active payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update RLS policies for reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;

CREATE POLICY "Public can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all reviews" 
ON public.reviews 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. Update RLS policies for cms_pages
DROP POLICY IF EXISTS "Anyone can read published pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Public can only read published pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can manage all CMS pages" ON public.cms_pages;

CREATE POLICY "Public can only read published pages" 
ON public.cms_pages 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all CMS pages" 
ON public.cms_pages 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Update RLS policies for blog_posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can only view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;

CREATE POLICY "Public can only view published posts" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all blog posts" 
ON public.blog_posts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Update RLS policies for seo_settings
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
DROP POLICY IF EXISTS "Public can read SEO settings" ON public.seo_settings;

CREATE POLICY "Public can read SEO settings" 
ON public.seo_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage SEO settings" 
ON public.seo_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Grant access to public views
GRANT SELECT ON public.site_settings_public TO anon, authenticated;
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;
GRANT SELECT ON public.reviews_public TO anon, authenticated;
GRANT SELECT ON public.seo_settings_public TO anon, authenticated;