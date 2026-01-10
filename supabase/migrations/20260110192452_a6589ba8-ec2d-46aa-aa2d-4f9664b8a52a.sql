-- Create users table for user profiles
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  subscription_plan TEXT NOT NULL DEFAULT 'free',
  trial_end_date TIMESTAMP WITH TIME ZONE,
  is_trial_active BOOLEAN NOT NULL DEFAULT false,
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_requests table for manual payment verification
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Payment requests RLS policies
CREATE POLICY "Users can view own payment requests" ON public.payment_requests
  FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create own payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Admins can view all payment requests" ON public.payment_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment requests" ON public.payment_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
      AND user_roles.role = 'admin'
    )
  );

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();