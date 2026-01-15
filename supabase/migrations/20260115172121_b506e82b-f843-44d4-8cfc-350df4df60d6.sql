-- Drop the old constraint
ALTER TABLE public.shop_cash_transactions DROP CONSTRAINT shop_cash_transactions_source_check;

-- Add new constraint with 'return' included
ALTER TABLE public.shop_cash_transactions ADD CONSTRAINT shop_cash_transactions_source_check 
CHECK (source = ANY (ARRAY['sale'::text, 'purchase'::text, 'expense'::text, 'owner_deposit'::text, 'owner_withdraw'::text, 'due_collection'::text, 'due_payment'::text, 'adjustment'::text, 'return'::text, 'supplier_payment'::text]));