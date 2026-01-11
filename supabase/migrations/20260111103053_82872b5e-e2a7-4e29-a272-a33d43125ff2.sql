-- Create payment_methods table for admin-configured payment options
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'mobile_money', -- bank, mobile_money, card, crypto, other
  account_number VARCHAR(100),
  account_name VARCHAR(200),
  instructions TEXT,
  icon VARCHAR(50) DEFAULT 'wallet', -- lucide icon name
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Public can view active payment methods
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Only admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.payment_methods REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;

-- Insert some default payment methods
INSERT INTO public.payment_methods (name, type, account_number, account_name, instructions, icon, display_order) VALUES
('bKash', 'mobile_money', '01XXXXXXXXX', 'Your Business Name', 'Send money to this bKash number and take a screenshot of the transaction.', 'smartphone', 1),
('Nagad', 'mobile_money', '01XXXXXXXXX', 'Your Business Name', 'Send money to this Nagad number and take a screenshot.', 'smartphone', 2),
('Bank Transfer', 'bank', 'XXXX-XXXX-XXXX', 'Your Business Name - Bank Name', 'Transfer to this bank account. Include your email in the reference.', 'landmark', 3);