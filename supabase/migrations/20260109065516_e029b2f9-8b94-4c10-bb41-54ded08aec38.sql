-- Drop digital product related tables
DROP TABLE IF EXISTS digital_downloads CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;

-- Remove digital product columns from products table
ALTER TABLE products 
DROP COLUMN IF EXISTS product_type,
DROP COLUMN IF EXISTS file_url,
DROP COLUMN IF EXISTS file_name,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS download_limit,
DROP COLUMN IF EXISTS license_key;

-- Remove digital product columns from shop_products table
ALTER TABLE shop_products 
DROP COLUMN IF EXISTS product_type,
DROP COLUMN IF EXISTS file_url,
DROP COLUMN IF EXISTS file_name,
DROP COLUMN IF EXISTS file_size,
DROP COLUMN IF EXISTS download_limit,
DROP COLUMN IF EXISTS license_key;

-- Remove digital product columns from shop_sale_items table
ALTER TABLE shop_sale_items
DROP COLUMN IF EXISTS product_type,
DROP COLUMN IF EXISTS download_id,
DROP COLUMN IF EXISTS license_key_id;