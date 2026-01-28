-- Add offline shop pricing columns to pricing_plans table
ALTER TABLE public.pricing_plans 
ADD COLUMN IF NOT EXISTS offline_shop_price_numeric numeric DEFAULT 999,
ADD COLUMN IF NOT EXISTS offline_shop_bundle_price_numeric numeric DEFAULT 500,
ADD COLUMN IF NOT EXISTS has_offline_shop_option boolean DEFAULT true;

-- Add offline shop standalone plan
INSERT INTO public.pricing_plans (
  id, name, name_bn, badge, badge_color, price_numeric, currency, period,
  description, description_bn, features, cta_text, cta_variant, 
  is_popular, is_active, display_order, offline_shop_price_numeric, 
  offline_shop_bundle_price_numeric, has_offline_shop_option
) VALUES (
  'offline-shop-standalone',
  'Offline Shop',
  'অফলাইন শপ',
  'SHOP ONLY',
  'bg-orange-100 text-orange-700',
  999,
  '৳',
  '/month',
  'Complete POS & inventory for physical stores',
  'ফিজিক্যাল দোকানের জন্য সম্পূর্ণ POS ও ইনভেন্টরি',
  '["Complete POS system", "Barcode scanning", "Inventory management", "Sales tracking", "Professional invoicing", "Customer management", "Expense tracking", "Daily cash register", "Supplier management", "Basic analytics"]'::jsonb,
  'Get Offline Shop',
  'default',
  false,
  true,
  0,
  999,
  500,
  false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_numeric = EXCLUDED.price_numeric,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Update existing plans with offline shop pricing info
UPDATE public.pricing_plans SET 
  offline_shop_price_numeric = 999,
  offline_shop_bundle_price_numeric = 500,
  has_offline_shop_option = true
WHERE id IN ('free-trial', 'starter', 'professional', 'business', 'lifetime');