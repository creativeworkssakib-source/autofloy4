-- Create webhook_configs table for storing editable webhook URLs
CREATE TABLE public.webhook_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (only admins can manage webhooks)
CREATE POLICY "Admins can view webhook configs"
ON public.webhook_configs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert webhook configs"
ON public.webhook_configs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update webhook configs"
ON public.webhook_configs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete webhook configs"
ON public.webhook_configs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default webhook configurations
INSERT INTO public.webhook_configs (id, name, description, category, icon, is_active, is_coming_soon) VALUES
-- Platform Webhooks
('facebook', 'Facebook Messenger', 'Messenger automation webhook', 'platform', 'Facebook', true, false),
('whatsapp', 'WhatsApp Business', 'WhatsApp automation webhook', 'platform', 'MessageCircle', false, true),
('instagram', 'Instagram DM', 'Instagram Direct Message webhook', 'platform', 'Instagram', false, true),
('email', 'Email Automation', 'Email notification webhook', 'platform', 'Mail', false, true),
('youtube', 'YouTube', 'YouTube automation webhook', 'platform', 'Youtube', false, true),
('ecommerce', 'E-commerce', 'E-commerce platform webhook', 'platform', 'ShoppingCart', false, true),
('website', 'Website Chat', 'Website chat widget webhook', 'platform', 'Globe', false, true),

-- System Webhooks
('payment_success', 'Payment Success', 'Triggered on successful payment', 'system', 'CreditCard', false, true),
('payment_failed', 'Payment Failed', 'Triggered on failed payment', 'system', 'AlertCircle', false, true),
('subscription_created', 'Subscription Created', 'New subscription webhook', 'system', 'CheckCircle', false, true),
('subscription_cancelled', 'Subscription Cancelled', 'Subscription cancellation webhook', 'system', 'XCircle', false, true),
('user_registered', 'User Registered', 'New user registration webhook', 'system', 'UserPlus', false, true),
('user_verified', 'User Verified', 'User verification complete webhook', 'system', 'UserCheck', false, true),

-- Automation Webhooks
('n8n_trigger', 'n8n Automation Trigger', 'General trigger for n8n workflows', 'automation', 'Webhook', true, false);

-- Add trigger for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
BEFORE UPDATE ON public.webhook_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();