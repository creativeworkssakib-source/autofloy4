-- Add payment_method_account column to store the actual account number used for payment
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS payment_method_account TEXT;