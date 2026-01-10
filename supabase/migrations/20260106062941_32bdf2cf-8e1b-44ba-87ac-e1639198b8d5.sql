-- =============================================
-- ADMIN PANEL - COMPREHENSIVE MANAGEMENT TABLES
-- =============================================

-- 1. CMS PAGES - For managing static pages (About, Contact, etc.)
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  content TEXT,
  content_bn TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published pages" ON public.cms_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Only admins can manage pages" ON public.cms_pages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. BLOG POSTS - For dynamic blog content
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,
  excerpt TEXT,
  content TEXT,
  content_bn TEXT,
  featured_image_url TEXT,
  category TEXT,
  tags TEXT[],
  author_name TEXT,
  read_time_minutes INT DEFAULT 5,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Only admins can manage posts" ON public.blog_posts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. PRICING PLANS - Database-driven pricing (admin editable)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT,
  badge TEXT,
  badge_color TEXT,
  price_numeric NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  period TEXT,
  description TEXT,
  description_bn TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  cta_text TEXT,
  cta_variant TEXT DEFAULT 'default',
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  original_price_numeric NUMERIC,
  discount_percent INT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.pricing_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage plans" ON public.pricing_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed initial pricing plans from existing data
INSERT INTO public.pricing_plans (id, name, badge, badge_color, price_numeric, period, description, features, cta_text, cta_variant, is_popular, original_price_numeric, discount_percent, display_order)
VALUES
('free-trial', 'Free Trial', 'TRY FREE', 'bg-success/10 text-success', 0, '/ trial', 'Try AutoFloy risk-free', 
  '["Online Business: 24 hours full access", "Offline Shop: 7 days full access", "AI auto-reply (Bengali & English)", "Image & voice message support", "Complete POS & inventory system", "Invoice generation", "Email support"]'::jsonb,
  'Start Free Trial', 'success', false, null, null, 1),
('starter', 'Starter', 'POPULAR', 'bg-primary/10 text-primary', 499, '/month', 'Perfect for small businesses',
  '["1 Facebook Page automation", "AI auto-reply (Bengali & English)", "Auto reply to comments", "Delete bad/negative comments", "Full Offline Shop access", "Inventory & sales tracking", "Professional invoicing", "Basic analytics", "Email support"]'::jsonb,
  'Choose Starter', 'default', true, 1996, 75, 2),
('professional', 'Professional', 'BEST VALUE', 'bg-secondary/10 text-secondary', 6999, '/month', 'Most popular choice',
  '["Everything in Starter", "2 Facebook Pages", "1 WhatsApp automation", "Image recognition & auto-reply", "Voice message understanding", "Online-Offline inventory sync", "Customer due management", "Advanced reports & analytics", "Priority email support"]'::jsonb,
  'Choose Professional', 'gradient', false, 9999, 30, 3),
('business', 'Business', 'ULTIMATE', 'bg-accent/10 text-accent', 19999, '/month', 'For serious sellers',
  '["Everything in Professional", "5 Facebook Pages", "2 WhatsApp automations", "Instagram automation", "TikTok automation (Coming)", "Multi-branch support", "Staff accounts & permissions", "Expense & cash management", "Supplier due tracking", "24/7 Phone + Email support", "Custom training session"]'::jsonb,
  'Choose Business', 'default', false, 39998, 50, 4),
('lifetime', 'Lifetime', 'EXCLUSIVE', 'bg-gradient-to-r from-primary to-secondary text-primary-foreground', 0, '', 'Pay once, use forever',
  '["Everything in Business", "Unlimited Facebook Pages", "Unlimited WhatsApp", "Lifetime updates", "All future features free", "Priority support forever", "VIP onboarding", "Custom integrations", "Dedicated account manager"]'::jsonb,
  'Contact Us', 'gradient', false, null, null, 5)
ON CONFLICT (id) DO NOTHING;

-- 4. APPEARANCE SETTINGS - Theme customization
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  -- Colors (HSL values)
  primary_color TEXT DEFAULT '217 100% 50%',
  secondary_color TEXT DEFAULT '262 100% 63%',
  accent_color TEXT DEFAULT '18 100% 60%',
  success_color TEXT DEFAULT '160 84% 39%',
  warning_color TEXT DEFAULT '38 92% 50%',
  destructive_color TEXT DEFAULT '0 84% 60%',
  -- Fonts
  heading_font TEXT DEFAULT 'Outfit',
  body_font TEXT DEFAULT 'Outfit',
  -- Hero/Landing
  hero_title TEXT DEFAULT 'AI-Powered Business Automation',
  hero_title_bn TEXT DEFAULT 'AI-চালিত ব্যবসা অটোমেশন',
  hero_subtitle TEXT,
  hero_image_url TEXT,
  -- Custom CSS (advanced)
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read appearance" ON public.appearance_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update appearance" ON public.appearance_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert appearance" ON public.appearance_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default appearance settings
INSERT INTO public.appearance_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 5. SEO SETTINGS - Global SEO configuration  
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  default_title TEXT DEFAULT 'AutoFloy - AI Business Automation',
  default_description TEXT DEFAULT 'AI-powered automation for Facebook, WhatsApp, and offline shop management.',
  default_keywords TEXT,
  og_image_url TEXT,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  google_analytics_id TEXT,
  google_tag_manager_id TEXT,
  facebook_pixel_id TEXT,
  robots_txt_content TEXT,
  sitemap_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SEO settings" ON public.seo_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage SEO" ON public.seo_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default SEO settings
INSERT INTO public.seo_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 6. EMAIL TEMPLATES - Customizable email content
CREATE TABLE IF NOT EXISTS public.email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_bn TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage email templates" ON public.email_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default email templates
INSERT INTO public.email_templates (id, name, subject, html_content, variables)
VALUES
('welcome', 'Welcome Email', 'Welcome to {company_name}!', 
  '<h1>Welcome to {company_name}!</h1><p>Hi {user_name},</p><p>Thank you for signing up. We''re excited to have you on board!</p><p>Best regards,<br/>{company_name} Team</p>',
  '["company_name", "user_name"]'::jsonb),
('password_reset', 'Password Reset', 'Reset Your Password - {company_name}',
  '<h1>Password Reset Request</h1><p>Hi {user_name},</p><p>Click the link below to reset your password:</p><p><a href="{reset_link}">Reset Password</a></p><p>This link expires in 1 hour.</p>',
  '["company_name", "user_name", "reset_link"]'::jsonb),
('subscription_confirmation', 'Subscription Confirmed', 'Your {plan_name} Plan is Active!',
  '<h1>Subscription Confirmed!</h1><p>Hi {user_name},</p><p>Your {plan_name} plan is now active. You can now access all features.</p><p>Amount: {amount}</p><p>Valid until: {end_date}</p>',
  '["user_name", "plan_name", "amount", "end_date"]'::jsonb),
('subscription_expiring', 'Subscription Expiring Soon', 'Your subscription expires in {days} days',
  '<h1>Subscription Expiring</h1><p>Hi {user_name},</p><p>Your {plan_name} subscription will expire on {end_date}.</p><p>Renew now to continue enjoying our services.</p>',
  '["user_name", "plan_name", "end_date", "days"]'::jsonb),
('due_reminder', 'Payment Due Reminder', 'Payment Reminder - {amount} Due',
  '<h1>Payment Reminder</h1><p>Dear {customer_name},</p><p>This is a reminder that you have an outstanding balance of {amount}.</p><p>Please make the payment at your earliest convenience.</p><p>Thank you,<br/>{shop_name}</p>',
  '["customer_name", "amount", "shop_name"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7. Create updated_at triggers for all new tables
CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appearance_settings_updated_at
  BEFORE UPDATE ON public.appearance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_order ON public.pricing_plans(display_order);