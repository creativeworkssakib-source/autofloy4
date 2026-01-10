-- Create table to track sent subscription reminders
CREATE TABLE public.subscription_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'trial_3_days', 'trial_1_day', 'trial_expired', 'renewal_7_days', 'renewal_1_day'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;

-- Only allow service role access (edge functions)
CREATE POLICY "Deny direct client access to subscription_reminders"
  ON public.subscription_reminders
  FOR ALL
  USING (false);

-- Create index for faster lookups
CREATE INDEX idx_subscription_reminders_user_type ON public.subscription_reminders(user_id, reminder_type);