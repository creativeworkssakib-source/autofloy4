-- Update default values for site_settings columns to use AutoFloy branding
ALTER TABLE public.site_settings 
  ALTER COLUMN company_name SET DEFAULT 'AutoFloy',
  ALTER COLUMN copyright_text SET DEFAULT '© {year} AutoFloy. All rights reserved.',
  ALTER COLUMN about_us SET DEFAULT 'AutoFloy is a SaaS tool for businesses that helps automate inbox replies, comments, and posting through Facebook and WhatsApp integration.',
  ALTER COLUMN support_email SET DEFAULT 'support@autofloy.online',
  ALTER COLUMN billing_email SET DEFAULT 'billing@autofloy.online',
  ALTER COLUMN legal_contact_email SET DEFAULT 'legal@autofloy.online',
  ALTER COLUMN website_url SET DEFAULT 'https://autofloy.online';