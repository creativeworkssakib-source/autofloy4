-- Create table to store customer purchase history (linked to sales)
-- This allows tracking what each customer bought

-- Add data_retention_days column to shop_settings for user-controlled retention
ALTER TABLE public.shop_settings 
ADD COLUMN IF NOT EXISTS data_retention_days integer DEFAULT NULL;

-- Add comment explaining NULL means unlimited retention
COMMENT ON COLUMN public.shop_settings.data_retention_days IS 'Number of days to retain customer history. NULL means unlimited (manual delete only)';

-- Add fields to shop_returns for resellable status and profit adjustment
ALTER TABLE public.shop_returns
ADD COLUMN IF NOT EXISTS is_resellable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS loss_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_sale_id uuid REFERENCES public.shop_sales(id),
ADD COLUMN IF NOT EXISTS original_sale_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS original_unit_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_restored boolean DEFAULT false;

-- Create index for faster customer history lookups
CREATE INDEX IF NOT EXISTS idx_shop_sales_customer_id ON public.shop_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_sale_items_sale_id ON public.shop_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_shop_customers_phone ON public.shop_customers(phone);
CREATE INDEX IF NOT EXISTS idx_shop_customers_name ON public.shop_customers(name);