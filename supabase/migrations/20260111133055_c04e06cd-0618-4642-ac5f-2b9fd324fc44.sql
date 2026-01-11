-- Create table for temporary quick daily expenses
-- These expenses are deleted when shop closes
CREATE TABLE IF NOT EXISTS public.shop_quick_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_quick_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own quick expenses"
ON public.shop_quick_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quick expenses"
ON public.shop_quick_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quick expenses"
ON public.shop_quick_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_shop_quick_expenses_user_shop_date ON public.shop_quick_expenses(user_id, shop_id, expense_date);