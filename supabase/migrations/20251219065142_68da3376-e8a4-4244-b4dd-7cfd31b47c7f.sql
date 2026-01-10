-- Create event status enum
CREATE TYPE public.webhook_event_status AS ENUM ('pending', 'sent', 'error');

-- Create outgoing_events table for n8n webhook integration
CREATE TABLE public.outgoing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.connected_accounts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status webhook_event_status NOT NULL DEFAULT 'pending',
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_outgoing_events_status ON public.outgoing_events(status);
CREATE INDEX idx_outgoing_events_event_type ON public.outgoing_events(event_type);
CREATE INDEX idx_outgoing_events_user_id ON public.outgoing_events(user_id);
CREATE INDEX idx_outgoing_events_created_at ON public.outgoing_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.outgoing_events ENABLE ROW LEVEL SECURITY;

-- Only allow service role and admin access (no direct client access)
CREATE POLICY "Deny direct client access to outgoing_events" 
ON public.outgoing_events 
FOR ALL 
TO public 
USING (false);

-- Admins can view all events (for admin panel)
CREATE POLICY "Admins can view all outgoing events"
ON public.outgoing_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_outgoing_events_updated_at
BEFORE UPDATE ON public.outgoing_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();