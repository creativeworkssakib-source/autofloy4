-- =============================================
-- OFFLINE SHOP BUSINESS DATABASE SCHEMA
-- =============================================

-- Shop Settings (store business info for invoice customization)
CREATE TABLE public.shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL DEFAULT 'My Shop',
  shop_address TEXT,
  shop_phone TEXT,
  shop_email TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'BDT',
  tax_rate NUMERIC DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_footer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Shop Product Categories
CREATE TABLE public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Products/Inventory
CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  unit TEXT DEFAULT 'pcs',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  expiry_date DATE,
  purchase_date DATE,
  supplier_name TEXT,
  supplier_contact TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Customers
CREATE TABLE public.shop_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC DEFAULT 0,
  total_due NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Sales/Transactions
CREATE TABLE public.shop_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.shop_customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  sale_date TIMESTAMPTZ DEFAULT now(),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Sale Items (products in each sale)
CREATE TABLE public.shop_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.shop_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  purchase_price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Purchases (buying products from suppliers)
CREATE TABLE public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_name TEXT,
  supplier_contact TEXT,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Purchase Items
CREATE TABLE public.shop_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.shop_purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Expenses
CREATE TABLE public.shop_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Damage/Loss Records
CREATE TABLE public.shop_damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  loss_amount NUMERIC DEFAULT 0,
  reason TEXT,
  damage_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_damages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (deny direct client access, use edge functions)
CREATE POLICY "Deny direct client access to shop_settings" ON public.shop_settings FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_categories" ON public.shop_categories FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_products" ON public.shop_products FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_customers" ON public.shop_customers FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_sales" ON public.shop_sales FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_sale_items" ON public.shop_sale_items FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_purchases" ON public.shop_purchases FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_purchase_items" ON public.shop_purchase_items FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_expenses" ON public.shop_expenses FOR ALL USING (false);
CREATE POLICY "Deny direct client access to shop_damages" ON public.shop_damages FOR ALL USING (false);

-- Indexes for better performance
CREATE INDEX idx_shop_products_user_id ON public.shop_products(user_id);
CREATE INDEX idx_shop_products_category_id ON public.shop_products(category_id);
CREATE INDEX idx_shop_sales_user_id ON public.shop_sales(user_id);
CREATE INDEX idx_shop_sales_customer_id ON public.shop_sales(customer_id);
CREATE INDEX idx_shop_sales_sale_date ON public.shop_sales(sale_date);
CREATE INDEX idx_shop_sale_items_sale_id ON public.shop_sale_items(sale_id);
CREATE INDEX idx_shop_customers_user_id ON public.shop_customers(user_id);
CREATE INDEX idx_shop_expenses_user_id ON public.shop_expenses(user_id);
CREATE INDEX idx_shop_expenses_expense_date ON public.shop_expenses(expense_date);
CREATE INDEX idx_shop_purchases_user_id ON public.shop_purchases(user_id);
CREATE INDEX idx_shop_damages_user_id ON public.shop_damages(user_id);