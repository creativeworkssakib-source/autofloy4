-- Add SMS template field to shop_settings for due reminder messages
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS due_reminder_sms_template TEXT DEFAULT 'প্রিয় {customer_name}, আপনার কাছে আমাদের {shop_name} এ মোট {due_amount} টাকা বাকি আছে। অনুগ্রহ করে যত দ্রুত সম্ভব পরিশোধ করুন। ধন্যবাদ।';

-- Add field to store SSL Wireless API key (optional, user can configure)
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS sms_api_key TEXT DEFAULT NULL;

ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS sms_sender_id TEXT DEFAULT NULL;