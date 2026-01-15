-- Add customer_name and customer_phone columns to shop_sales for direct storage
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE shop_sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;