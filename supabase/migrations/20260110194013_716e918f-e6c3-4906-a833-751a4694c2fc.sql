-- Drop and recreate site_settings with correct structure
DROP TABLE IF EXISTS site_settings CASCADE;

CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'AutoFloy',
  tagline text DEFAULT 'AI-powered automation for your business',
  about_us text DEFAULT 'A SaaS tool for businesses that helps automate inbox replies, comments, and posting through Facebook and WhatsApp integration.',
  logo_url text,
  favicon_url text,
  support_email text DEFAULT 'support@autofloy.com',
  billing_email text DEFAULT 'billing@autofloy.com',
  legal_contact_email text DEFAULT 'legal@autofloy.com',
  phone_number text DEFAULT '+880 1234-567890',
  company_address text DEFAULT '123 Business Street',
  city text DEFAULT 'Dhaka',
  state text,
  country text DEFAULT 'Bangladesh',
  postal_code text,
  website_url text,
  facebook_url text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  copyright_text text DEFAULT '© {year} AutoFloy. All rights reserved.',
  platform_sms_enabled boolean DEFAULT false,
  platform_sms_api_key text,
  platform_sms_sender_id text,
  platform_sms_provider text DEFAULT 'ssl_wireless',
  sms_limit_trial integer DEFAULT 0,
  sms_limit_starter integer DEFAULT 50,
  sms_limit_professional integer DEFAULT 200,
  sms_limit_business integer DEFAULT 1000,
  sms_limit_lifetime integer DEFAULT -1,
  demo_video_type text DEFAULT 'youtube',
  demo_video_youtube_url text,
  demo_video_upload_url text,
  demo_video_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for site_settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Admin update access
CREATE POLICY "Admin update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.site_settings (id, company_name, tagline, about_us)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AutoFloy',
  'Offline Shop Management System',
  'Complete offline business management solution for shops in Bangladesh. Manage products, sales, inventory, customers, suppliers and more.'
);

-- Update appearance_settings structure  
DROP TABLE IF EXISTS appearance_settings CASCADE;

CREATE TABLE public.appearance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#8B5CF6',
  secondary_color text DEFAULT '#3B82F6',
  font_family text DEFAULT 'Inter',
  dark_mode_enabled boolean DEFAULT true,
  custom_css text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for appearance_settings"
ON public.appearance_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin update appearance_settings"
ON public.appearance_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.appearance_settings (id, primary_color, secondary_color, font_family, dark_mode_enabled)
VALUES ('00000000-0000-0000-0000-000000000002', '#8B5CF6', '#3B82F6', 'Inter', true);

-- Update seo_settings structure
DROP TABLE IF EXISTS seo_settings CASCADE;

CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_title text DEFAULT 'AutoFloy - Shop Management',
  meta_description text DEFAULT 'Complete offline shop management solution',
  meta_keywords text,
  og_image text,
  robots_txt text,
  sitemap_enabled boolean DEFAULT true,
  google_analytics_id text,
  google_tag_manager_id text,
  facebook_pixel_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for seo_settings"
ON public.seo_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin update seo_settings"
ON public.seo_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

INSERT INTO public.seo_settings (id, meta_title, meta_description, sitemap_enabled)
VALUES ('00000000-0000-0000-0000-000000000003', 'AutoFloy - Offline Shop Management', 'Complete offline shop management solution for Bangladesh businesses', true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';