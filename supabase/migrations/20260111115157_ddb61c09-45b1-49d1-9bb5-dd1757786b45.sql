-- Create shop_loans table for tracking all loans
CREATE TABLE public.shop_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  lender_name TEXT NOT NULL,
  lender_type TEXT NOT NULL DEFAULT 'bank', -- bank, ngo, personal, other
  loan_amount NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  total_installments INTEGER NOT NULL DEFAULT 1,
  installment_amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_date DATE,
  payment_day INTEGER DEFAULT 1, -- day of month for payment
  total_paid NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, defaulted
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_loan_payments table for payment history
CREATE TABLE public.shop_loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.shop_loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  installment_number INTEGER,
  late_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_loans
CREATE POLICY "Users can view their own loans" ON public.shop_loans
  FOR SELECT USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own loans" ON public.shop_loans
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own loans" ON public.shop_loans
  FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own loans" ON public.shop_loans
  FOR DELETE USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for shop_loan_payments
CREATE POLICY "Users can view their own loan payments" ON public.shop_loan_payments
  FOR SELECT USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own loan payments" ON public.shop_loan_payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own loan payments" ON public.shop_loan_payments
  FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own loan payments" ON public.shop_loan_payments
  FOR DELETE USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes for better performance
CREATE INDEX idx_shop_loans_user_id ON public.shop_loans(user_id);
CREATE INDEX idx_shop_loans_shop_id ON public.shop_loans(shop_id);
CREATE INDEX idx_shop_loans_status ON public.shop_loans(status);
CREATE INDEX idx_shop_loans_next_payment ON public.shop_loans(next_payment_date);
CREATE INDEX idx_shop_loan_payments_loan_id ON public.shop_loan_payments(loan_id);
CREATE INDEX idx_shop_loan_payments_user_id ON public.shop_loan_payments(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_shop_loans_updated_at
  BEFORE UPDATE ON public.shop_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();