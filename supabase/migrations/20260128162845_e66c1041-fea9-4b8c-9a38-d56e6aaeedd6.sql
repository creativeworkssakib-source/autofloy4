-- Update all plans to have the SAME offline features since price is same (999)
-- All offline shop users get FULL access regardless of which plan they choose

UPDATE pricing_plans SET offline_features = '["Complete POS system", "Barcode scanning & generation", "Full inventory management", "Sales & purchase tracking", "Professional invoicing", "Customer management", "Supplier management", "Customer due tracking", "Expense management", "Loan management", "Staff accounts & permissions", "Multi-branch support", "Advanced reports & analytics", "24/7 Phone + Email support"]'::jsonb
WHERE id IN ('starter', 'professional', 'business', 'lifetime');

-- Also update Free Trial offline features to show what they'll get
UPDATE pricing_plans SET offline_features = '["Complete POS system", "Barcode scanning & generation", "Full inventory management", "Sales & purchase tracking", "Professional invoicing", "Customer management", "Basic reports", "7 days full access"]'::jsonb
WHERE id = 'free-trial';