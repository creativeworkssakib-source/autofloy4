-- Migrate existing data: set shop_id for all records that don't have one
-- This will assign existing data to the user's default or first shop

-- First, let's create a function to get the user's default shop
CREATE OR REPLACE FUNCTION get_user_default_shop(p_user_id UUID) 
RETURNS UUID AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  -- Try to get the default shop first
  SELECT id INTO v_shop_id 
  FROM public.shops 
  WHERE user_id = p_user_id AND is_default = true AND is_active = true 
  LIMIT 1;
  
  -- If no default, get the first shop
  IF v_shop_id IS NULL THEN
    SELECT id INTO v_shop_id 
    FROM public.shops 
    WHERE user_id = p_user_id AND is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update shop_products
UPDATE public.shop_products 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_sales  
UPDATE public.shop_sales 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_customers
UPDATE public.shop_customers 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_suppliers
UPDATE public.shop_suppliers 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_purchases
UPDATE public.shop_purchases 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_expenses
UPDATE public.shop_expenses 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_returns
UPDATE public.shop_returns 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_cash_transactions
UPDATE public.shop_cash_transactions 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_stock_adjustments
UPDATE public.shop_stock_adjustments 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_damages
UPDATE public.shop_damages 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_categories
UPDATE public.shop_categories 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_settings
UPDATE public.shop_settings 
SET shop_id = get_user_default_shop(user_id) 
WHERE shop_id IS NULL;

-- Update shop_staff_users (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_staff_users') THEN
    EXECUTE 'UPDATE public.shop_staff_users SET shop_id = get_user_default_shop(user_id) WHERE shop_id IS NULL';
  END IF;
END $$;

-- Update shop_supplier_returns (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_supplier_returns') THEN
    EXECUTE 'UPDATE public.shop_supplier_returns SET shop_id = get_user_default_shop(user_id) WHERE shop_id IS NULL';
  END IF;
END $$;

-- Update shop_supplier_payments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_supplier_payments') THEN
    EXECUTE 'UPDATE public.shop_supplier_payments SET shop_id = get_user_default_shop(user_id) WHERE shop_id IS NULL';
  END IF;
END $$;

-- Drop the helper function after migration
DROP FUNCTION IF EXISTS get_user_default_shop(UUID);