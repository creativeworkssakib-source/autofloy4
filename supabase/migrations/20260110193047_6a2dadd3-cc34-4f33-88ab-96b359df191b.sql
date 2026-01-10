-- =============================
-- OFFLINE SHOP COMPLETE DATABASE SCHEMA
-- =============================

-- 1. SHOPS TABLE (Multi-shop support)
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. SHOP CATEGORIES
CREATE TABLE public.shop_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. SHOP PRODUCTS
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  description TEXT,
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  average_cost NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'pcs',
  image_url TEXT,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. SHOP STOCK BATCHES (FIFO inventory)
CREATE TABLE public.shop_stock_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  purchase_id UUID,
  purchase_item_id UUID,
  expiry_date DATE,
  is_initial_batch BOOLEAN DEFAULT false,
  batch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. SHOP CUSTOMERS
CREATE TABLE public.shop_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. SHOP SUPPLIERS
CREATE TABLE public.shop_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. SHOP SALES
CREATE TABLE public.shop_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.shop_customers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. SHOP SALE ITEMS
CREATE TABLE public.shop_sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.shop_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  purchase_price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  profit NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. SHOP PURCHASES
CREATE TABLE public.shop_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.shop_suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  supplier_name TEXT,
  supplier_contact TEXT,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. SHOP PURCHASE ITEMS
CREATE TABLE public.shop_purchase_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.shop_purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. SHOP PURCHASE PAYMENTS
CREATE TABLE public.shop_purchase_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.shop_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. SHOP SUPPLIER PAYMENTS
CREATE TABLE public.shop_supplier_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.shop_suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.shop_purchases(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. SHOP EXPENSES
CREATE TABLE public.shop_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 14. SHOP ADJUSTMENTS (Stock adjustments)
CREATE TABLE public.shop_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 15. SHOP CASH TRANSACTIONS
CREATE TABLE public.shop_cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  reference_id UUID,
  reference_type TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 16. SHOP RETURNS
CREATE TABLE public.shop_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  original_sale_id UUID REFERENCES public.shop_sales(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.shop_customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  return_reason TEXT NOT NULL,
  refund_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  return_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 17. SHOP RETURN ITEMS
CREATE TABLE public.shop_return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES public.shop_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 18. SHOP DAMAGES
CREATE TABLE public.shop_damages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  estimated_loss NUMERIC DEFAULT 0,
  reason TEXT,
  notes TEXT,
  damage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 19. SHOP STAFF USERS
CREATE TABLE public.shop_staff_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 20. SHOP SETTINGS
CREATE TABLE public.shop_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'BDT',
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INTEGER DEFAULT 1,
  tax_rate NUMERIC DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  auto_generate_barcode BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  sms_api_key TEXT,
  sms_sender_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- 21. SHOP TRASH (Soft delete)
CREATE TABLE public.shop_trash (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  original_table TEXT NOT NULL,
  original_id UUID NOT NULL,
  data JSONB NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 22. SHOP PRODUCT HISTORY
CREATE TABLE public.shop_product_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity_added INTEGER DEFAULT 0,
  quantity_sold INTEGER DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 23. PRICING PLANS TABLE (for plan limits)
CREATE TABLE public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC DEFAULT 0,
  price_yearly NUMERIC DEFAULT 0,
  max_shops INTEGER DEFAULT 1,
  max_products INTEGER DEFAULT 100,
  max_staff INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing plans
INSERT INTO public.pricing_plans (id, name, description, price_monthly, max_shops, max_products, max_staff, features) VALUES
  ('free', 'Free', 'Basic features for small shops', 0, 1, 50, 1, '["Basic inventory", "Sales tracking", "Customer management"]'),
  ('starter', 'Starter', 'For growing businesses', 299, 2, 500, 3, '["All Free features", "Multiple shops", "Barcode scanning", "Reports"]'),
  ('professional', 'Professional', 'Advanced features for serious shops', 599, 5, 2000, 10, '["All Starter features", "Advanced analytics", "Staff management", "SMS notifications"]'),
  ('enterprise', 'Enterprise', 'Unlimited everything', 999, -1, -1, -1, '["All Professional features", "Unlimited shops", "Unlimited products", "Priority support"]');

-- =============================
-- ENABLE ROW LEVEL SECURITY
-- =============================
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchase_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- =============================
-- RLS POLICIES (Service role bypasses RLS)
-- =============================

-- Pricing plans are public read
CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);

-- All shop tables: Users can manage their own data
-- Since edge functions use service role, these are for direct client access

CREATE POLICY "Users can manage own shops" ON public.shops FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own categories" ON public.shop_categories FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own products" ON public.shop_products FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own stock batches" ON public.shop_stock_batches FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own customers" ON public.shop_customers FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own suppliers" ON public.shop_suppliers FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own sales" ON public.shop_sales FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own purchases" ON public.shop_purchases FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own purchase payments" ON public.shop_purchase_payments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own supplier payments" ON public.shop_supplier_payments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own expenses" ON public.shop_expenses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own adjustments" ON public.shop_adjustments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own cash transactions" ON public.shop_cash_transactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own returns" ON public.shop_returns FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own damages" ON public.shop_damages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own staff" ON public.shop_staff_users FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own settings" ON public.shop_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own trash" ON public.shop_trash FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage own product history" ON public.shop_product_history FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Sale items and purchase items policies (based on parent ownership)
CREATE POLICY "Users can view sale items" ON public.shop_sale_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.shop_sales WHERE shop_sales.id = shop_sale_items.sale_id AND shop_sales.user_id = auth.uid()));

CREATE POLICY "Users can insert sale items" ON public.shop_sale_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.shop_sales WHERE shop_sales.id = shop_sale_items.sale_id AND shop_sales.user_id = auth.uid()));

CREATE POLICY "Users can delete sale items" ON public.shop_sale_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.shop_sales WHERE shop_sales.id = shop_sale_items.sale_id AND shop_sales.user_id = auth.uid()));

CREATE POLICY "Users can view purchase items" ON public.shop_purchase_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.shop_purchases WHERE shop_purchases.id = shop_purchase_items.purchase_id AND shop_purchases.user_id = auth.uid()));

CREATE POLICY "Users can insert purchase items" ON public.shop_purchase_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.shop_purchases WHERE shop_purchases.id = shop_purchase_items.purchase_id AND shop_purchases.user_id = auth.uid()));

CREATE POLICY "Users can delete purchase items" ON public.shop_purchase_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.shop_purchases WHERE shop_purchases.id = shop_purchase_items.purchase_id AND shop_purchases.user_id = auth.uid()));

CREATE POLICY "Users can view return items" ON public.shop_return_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.shop_returns WHERE shop_returns.id = shop_return_items.return_id AND shop_returns.user_id = auth.uid()));

CREATE POLICY "Users can insert return items" ON public.shop_return_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.shop_returns WHERE shop_returns.id = shop_return_items.return_id AND shop_returns.user_id = auth.uid()));

CREATE POLICY "Users can delete return items" ON public.shop_return_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.shop_returns WHERE shop_returns.id = shop_return_items.return_id AND shop_returns.user_id = auth.uid()));

-- =============================
-- INDEXES FOR PERFORMANCE
-- =============================
CREATE INDEX idx_shops_user_id ON public.shops(user_id);
CREATE INDEX idx_shop_products_user_shop ON public.shop_products(user_id, shop_id);
CREATE INDEX idx_shop_products_barcode ON public.shop_products(barcode);
CREATE INDEX idx_shop_sales_user_shop ON public.shop_sales(user_id, shop_id);
CREATE INDEX idx_shop_sales_date ON public.shop_sales(sale_date);
CREATE INDEX idx_shop_customers_user_shop ON public.shop_customers(user_id, shop_id);
CREATE INDEX idx_shop_suppliers_user_shop ON public.shop_suppliers(user_id, shop_id);
CREATE INDEX idx_shop_purchases_user_shop ON public.shop_purchases(user_id, shop_id);
CREATE INDEX idx_shop_expenses_user_shop ON public.shop_expenses(user_id, shop_id);
CREATE INDEX idx_shop_stock_batches_product ON public.shop_stock_batches(product_id);
CREATE INDEX idx_shop_trash_user_shop ON public.shop_trash(user_id, shop_id);

-- =============================
-- UPDATE TIMESTAMP FUNCTION
-- =============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_products_updated_at BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_customers_updated_at BEFORE UPDATE ON public.shop_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_suppliers_updated_at BEFORE UPDATE ON public.shop_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_sales_updated_at BEFORE UPDATE ON public.shop_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_purchases_updated_at BEFORE UPDATE ON public.shop_purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_expenses_updated_at BEFORE UPDATE ON public.shop_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_returns_updated_at BEFORE UPDATE ON public.shop_returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_staff_updated_at BEFORE UPDATE ON public.shop_staff_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_settings_updated_at BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();