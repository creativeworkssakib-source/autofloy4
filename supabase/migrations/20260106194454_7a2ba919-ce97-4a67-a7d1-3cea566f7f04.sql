
-- ===== SHOPS TABLE (Multi-business support) =====
-- This table stores multiple shops/businesses per user

CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shops
CREATE POLICY "Users can view their own shops"
  ON public.shops FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own shops"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own shops"
  ON public.shops FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own shops"
  ON public.shops FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Create index for faster queries
CREATE INDEX idx_shops_user_id ON public.shops(user_id);
CREATE INDEX idx_shops_is_active ON public.shops(is_active);

-- Add shop_id column to all shop-related tables

-- Shop Products
ALTER TABLE public.shop_products 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_products_shop_id ON public.shop_products(shop_id);

-- Shop Sales
ALTER TABLE public.shop_sales 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_sales_shop_id ON public.shop_sales(shop_id);

-- Shop Customers
ALTER TABLE public.shop_customers 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_customers_shop_id ON public.shop_customers(shop_id);

-- Shop Suppliers
ALTER TABLE public.shop_suppliers 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_suppliers_shop_id ON public.shop_suppliers(shop_id);

-- Shop Purchases
ALTER TABLE public.shop_purchases 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_purchases_shop_id ON public.shop_purchases(shop_id);

-- Shop Expenses
ALTER TABLE public.shop_expenses 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_expenses_shop_id ON public.shop_expenses(shop_id);

-- Shop Returns
ALTER TABLE public.shop_returns 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_returns_shop_id ON public.shop_returns(shop_id);

-- Shop Cash Transactions
ALTER TABLE public.shop_cash_transactions 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_cash_transactions_shop_id ON public.shop_cash_transactions(shop_id);

-- Shop Stock Adjustments
ALTER TABLE public.shop_stock_adjustments 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_stock_adjustments_shop_id ON public.shop_stock_adjustments(shop_id);

-- Shop Damages
ALTER TABLE public.shop_damages 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_damages_shop_id ON public.shop_damages(shop_id);

-- Shop Categories
ALTER TABLE public.shop_categories 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_categories_shop_id ON public.shop_categories(shop_id);

-- Shop Settings (one settings per shop)
ALTER TABLE public.shop_settings 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_settings_shop_id ON public.shop_settings(shop_id);

-- Shop Staff Users
ALTER TABLE public.shop_staff_users 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_staff_users_shop_id ON public.shop_staff_users(shop_id);

-- Shop Supplier Returns
ALTER TABLE public.shop_supplier_returns 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_supplier_returns_shop_id ON public.shop_supplier_returns(shop_id);

-- Shop Supplier Payments
ALTER TABLE public.shop_supplier_payments 
ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
CREATE INDEX idx_shop_supplier_payments_shop_id ON public.shop_supplier_payments(shop_id);

-- Add max_shops column to pricing_plans table
ALTER TABLE public.pricing_plans 
ADD COLUMN max_shops INTEGER DEFAULT 1;

-- Update default max_shops for existing plans based on plan_id
UPDATE public.pricing_plans SET max_shops = 1 WHERE id = 'free-trial';
UPDATE public.pricing_plans SET max_shops = 1 WHERE id = 'starter';
UPDATE public.pricing_plans SET max_shops = 3 WHERE id = 'professional';
UPDATE public.pricing_plans SET max_shops = 5 WHERE id = 'business';
UPDATE public.pricing_plans SET max_shops = -1 WHERE id = 'lifetime'; -- unlimited

-- Add trigger for updated_at
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
