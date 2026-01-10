-- Enable RLS on remaining tables and deny direct client access
-- (Edge functions with service role key bypass RLS)

-- execution_logs - contains automation execution data
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to execution_logs" ON public.execution_logs
  FOR ALL USING (false);

-- image_messages - contains user messages with images
ALTER TABLE public.image_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to image_messages" ON public.image_messages
  FOR ALL USING (false);

-- invoices - contains billing information
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to invoices" ON public.invoices
  FOR ALL USING (false);

-- notifications - contains user notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to notifications" ON public.notifications
  FOR ALL USING (false);

-- reviews - public reviews, allow read but deny write for non-service
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Deny direct write access to reviews" ON public.reviews
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny direct update access to reviews" ON public.reviews
  FOR UPDATE USING (false);
CREATE POLICY "Deny direct delete access to reviews" ON public.reviews
  FOR DELETE USING (false);

-- subscriptions - contains subscription data
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to subscriptions" ON public.subscriptions
  FOR ALL USING (false);

-- voice_messages - contains user voice messages
ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct client access to voice_messages" ON public.voice_messages
  FOR ALL USING (false);