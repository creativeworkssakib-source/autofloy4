-- =============================================
-- OFFLINE SHOP BUSINESS - EXTENDED SCHEMA
-- =============================================

-- 1. SUPPLIERS TABLE
CREATE TABLE public.shop_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shop_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct client access to shop_suppliers"
  ON public.shop_suppliers
  FOR ALL
  USING (false);

CREATE INDEX idx_shop_suppliers_user_id ON public.shop_suppliers(user_id);

-- 2. CASH TRANSACTIONS TABLE
CREATE TABLE public.shop_cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  source TEXT NOT NULL CHECK (source IN ('sale', 'purchase', 'expense', 'owner_deposit', 'owner_withdraw', 'due_collection', 'due_payment', 'adjustment')),
  amount NUMERIC NOT NULL DEFAULT 0,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shop_cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct client access to shop_cash_transactions"
  ON public.shop_cash_transactions
  FOR ALL
  USING (false);

CREATE INDEX idx_shop_cash_transactions_user_id ON public.shop_cash_transactions(user_id);
CREATE INDEX idx_shop_cash_transactions_date ON public.shop_cash_transactions(transaction_date);

-- 3. STAFF USERS TABLE
CREATE TABLE public.shop_staff_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'cashier', 'staff')),
  permissions JSONB DEFAULT '{
    "can_see_reports": false,
    "can_edit_products": false,
    "can_record_purchases": false,
    "can_record_sales": true,
    "can_see_profit": false,
    "can_manage_staff": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shop_staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct client access to shop_staff_users"
  ON public.shop_staff_users
  FOR ALL
  USING (false);

CREATE INDEX idx_shop_staff_users_user_id ON public.shop_staff_users(user_id);

-- 4. STOCK ADJUSTMENTS TABLE (Separate from damages for better tracking)
CREATE TABLE public.shop_stock_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('damage', 'loss', 'expired', 'manual_increase', 'manual_decrease', 'theft', 'return')),
  quantity INTEGER NOT NULL DEFAULT 1,
  adjustment_date DATE DEFAULT CURRENT_DATE,
  reason TEXT,
  cost_impact NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shop_stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct client access to shop_stock_adjustments"
  ON public.shop_stock_adjustments
  FOR ALL
  USING (false);

CREATE INDEX idx_shop_stock_adjustments_user_id ON public.shop_stock_adjustments(user_id);
CREATE INDEX idx_shop_stock_adjustments_product_id ON public.shop_stock_adjustments(product_id);

-- 5. Add supplier_id to shop_purchases (link purchases to suppliers)
ALTER TABLE public.shop_purchases ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.shop_suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.shop_purchases ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- 6. Add opening_balance to shop_customers
ALTER TABLE public.shop_customers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0;

-- 7. Add cost tracking to shop_sales
ALTER TABLE public.shop_sales ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE public.shop_sales ADD COLUMN IF NOT EXISTS total_profit NUMERIC DEFAULT 0;

-- 8. Extend shop_settings with more options
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS default_tax_rate NUMERIC DEFAULT 0;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS enable_online_sync BOOLEAN DEFAULT false;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS opening_date DATE;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS opening_cash_balance NUMERIC DEFAULT 0;

-- 9. Add brand column to shop_products
ALTER TABLE public.shop_products ADD COLUMN IF NOT EXISTS brand TEXT;