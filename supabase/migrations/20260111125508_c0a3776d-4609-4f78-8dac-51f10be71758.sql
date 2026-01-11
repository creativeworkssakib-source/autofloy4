-- Create daily cash register table for tracking opening/closing cash
CREATE TABLE public.shop_daily_cash_register (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  register_date DATE NOT NULL,
  opening_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
  opening_time TIMESTAMP WITH TIME ZONE,
  closing_cash NUMERIC(12, 2),
  closing_time TIMESTAMP WITH TIME ZONE,
  total_sales NUMERIC(12, 2) DEFAULT 0,
  total_cash_sales NUMERIC(12, 2) DEFAULT 0,
  total_card_sales NUMERIC(12, 2) DEFAULT 0,
  total_mobile_sales NUMERIC(12, 2) DEFAULT 0,
  total_due_collected NUMERIC(12, 2) DEFAULT 0,
  total_expenses NUMERIC(12, 2) DEFAULT 0,
  total_withdrawals NUMERIC(12, 2) DEFAULT 0,
  total_deposits NUMERIC(12, 2) DEFAULT 0,
  expected_cash NUMERIC(12, 2) DEFAULT 0,
  cash_difference NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id, register_date)
);

-- Enable Row Level Security
ALTER TABLE public.shop_daily_cash_register ENABLE ROW LEVEL SECURITY;

-- Create policies for shop_daily_cash_register
CREATE POLICY "Users can view their own cash registers" 
ON public.shop_daily_cash_register 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash registers" 
ON public.shop_daily_cash_register 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash registers" 
ON public.shop_daily_cash_register 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash registers" 
ON public.shop_daily_cash_register 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_shop_daily_cash_register_user_date ON public.shop_daily_cash_register(user_id, shop_id, register_date DESC);
CREATE INDEX idx_shop_daily_cash_register_status ON public.shop_daily_cash_register(user_id, shop_id, status);