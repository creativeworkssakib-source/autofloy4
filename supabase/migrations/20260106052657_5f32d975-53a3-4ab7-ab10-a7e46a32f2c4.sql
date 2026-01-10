-- Add platform SMS provider settings to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS platform_sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS platform_sms_api_key TEXT,
ADD COLUMN IF NOT EXISTS platform_sms_sender_id TEXT,
ADD COLUMN IF NOT EXISTS platform_sms_provider TEXT DEFAULT 'ssl_wireless';

-- Add use_platform_sms column to shop_settings for users to choose platform SMS or their own
ALTER TABLE public.shop_settings
ADD COLUMN IF NOT EXISTS use_platform_sms BOOLEAN DEFAULT true;

-- Comment: 
-- platform_sms_enabled: Admin can enable/disable platform-wide SMS service
-- platform_sms_api_key: Admin's SMS provider API key for all users
-- platform_sms_sender_id: Admin's sender ID
-- platform_sms_provider: Which provider admin is using (ssl_wireless, bulk_sms, etc.)
-- use_platform_sms: If true, user uses platform's SMS. If false, user uses their own API.