-- Add new status values to order_status_type enum
ALTER TYPE public.order_status_type ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE public.order_status_type ADD VALUE IF NOT EXISTS 'damaged';
ALTER TYPE public.order_status_type ADD VALUE IF NOT EXISTS 'expired';

-- Add external_id column for invoice_id mapping if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add order_date column for explicit date tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_date DATE;

-- Create index for efficient date-range queries
CREATE INDEX IF NOT EXISTS idx_orders_user_date ON public.orders(user_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);