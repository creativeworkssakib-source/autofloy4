-- Add separate feature columns for online and offline
ALTER TABLE pricing_plans 
ADD COLUMN IF NOT EXISTS online_features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS offline_features jsonb DEFAULT '[]'::jsonb;

-- Update existing plans with proper separated features
UPDATE pricing_plans SET 
  online_features = CASE 
    WHEN id = 'starter' THEN '["1 Facebook Page automation", "AI auto-reply (Bengali & English)", "Auto reply to comments", "Delete bad/negative comments", "Basic analytics", "Email support"]'::jsonb
    WHEN id = 'professional' THEN '["Everything in Starter", "2 Facebook Pages", "1 WhatsApp automation", "Image recognition & auto-reply", "Voice message understanding", "Advanced reports & analytics", "Priority email support"]'::jsonb
    WHEN id = 'business' THEN '["Everything in Professional", "5 Facebook Pages", "2 WhatsApp automations", "Instagram automation", "TikTok automation (Coming)", "Multi-branch support", "Staff accounts & permissions", "24/7 Phone + Email support", "Custom training session"]'::jsonb
    WHEN id = 'free-trial' THEN '["Online Business: 24 hours full access", "AI auto-reply (Bengali & English)", "Image & voice message support", "All premium features included", "Email support"]'::jsonb
    WHEN id = 'lifetime' THEN '["Everything in Business", "Unlimited Facebook Pages", "Unlimited WhatsApp", "Lifetime updates", "All future features free", "Priority support forever", "VIP onboarding", "Custom integrations", "Dedicated account manager"]'::jsonb
    ELSE online_features
  END,
  offline_features = CASE 
    WHEN id = 'starter' THEN '["Complete POS system", "Barcode scanning & generation", "Inventory management", "Sales & purchase tracking", "Professional invoicing", "Customer management", "Basic reports", "Email support"]'::jsonb
    WHEN id = 'professional' THEN '["Everything in Starter", "Advanced inventory tracking", "Supplier management", "Customer due tracking", "Expense management", "Advanced reports & analytics", "Priority email support"]'::jsonb
    WHEN id = 'business' THEN '["Everything in Professional", "Multi-branch support", "Staff accounts & permissions", "Expense & cash management", "Supplier due tracking", "Loan management", "24/7 Phone + Email support", "Custom training session"]'::jsonb
    WHEN id = 'free-trial' THEN '["Offline Shop: 7 days full access", "Complete POS & inventory system", "Invoice generation", "Customer management", "All premium features included", "Email support"]'::jsonb
    WHEN id = 'lifetime' THEN '["Everything in Business", "Unlimited shops", "All future features free", "Priority support forever", "VIP onboarding", "Custom integrations", "Dedicated account manager"]'::jsonb
    ELSE offline_features
  END
WHERE is_active = true;