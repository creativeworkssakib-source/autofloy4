-- Add purchase_price and min_stock_alert to products table for profit tracking
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_alert integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS expiry_date date,
ADD COLUMN IF NOT EXISTS supplier_name text;

-- Add comment for clarity
COMMENT ON COLUMN public.products.purchase_price IS 'Cost price per unit for profit calculation';
COMMENT ON COLUMN public.products.min_stock_alert IS 'Minimum stock level before low stock warning';
COMMENT ON COLUMN public.products.unit IS 'Unit of measurement (pcs, kg, ltr, box, pack, dozen)';