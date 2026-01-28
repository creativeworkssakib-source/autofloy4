-- Create customer follow-up tracking table
CREATE TABLE public.customer_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_fb_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  platform TEXT NOT NULL DEFAULT 'facebook', -- facebook, instagram, whatsapp
  has_purchased BOOLEAN DEFAULT false,
  total_messages INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_products_discussed TEXT[],
  conversation_summary TEXT,
  followup_count INTEGER DEFAULT 0,
  last_followup_at TIMESTAMP WITH TIME ZONE,
  last_followup_message TEXT,
  status TEXT DEFAULT 'active', -- active, converted, lost
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_fb_id, platform)
);

-- Enable RLS
ALTER TABLE public.customer_followups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own customer followups"
ON public.customer_followups FOR SELECT
USING (auth.uid()::text = user_id::text OR EXISTS (
  SELECT 1 FROM users WHERE id = user_id AND id::text = auth.uid()::text
));

CREATE POLICY "Users can insert their own customer followups"
ON public.customer_followups FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own customer followups"
ON public.customer_followups FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own customer followups"
ON public.customer_followups FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_customer_followups_user_id ON public.customer_followups(user_id);
CREATE INDEX idx_customer_followups_has_purchased ON public.customer_followups(user_id, has_purchased);
CREATE INDEX idx_customer_followups_platform ON public.customer_followups(user_id, platform);
CREATE INDEX idx_customer_followups_status ON public.customer_followups(user_id, status);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_followups_updated_at
BEFORE UPDATE ON public.customer_followups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create follow-up message logs table
CREATE TABLE public.followup_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_followup_id UUID REFERENCES public.customer_followups(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  message_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'sms', -- sms, whatsapp
  status TEXT DEFAULT 'sent', -- sent, delivered, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.followup_message_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own followup logs"
ON public.followup_message_logs FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own followup logs"
ON public.followup_message_logs FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Create index
CREATE INDEX idx_followup_message_logs_user_id ON public.followup_message_logs(user_id);
CREATE INDEX idx_followup_message_logs_customer ON public.followup_message_logs(customer_followup_id);