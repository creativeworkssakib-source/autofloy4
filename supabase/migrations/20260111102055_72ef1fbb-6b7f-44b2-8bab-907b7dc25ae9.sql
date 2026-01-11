-- Enable realtime for payment_requests table
ALTER TABLE public.payment_requests REPLICA IDENTITY FULL;

-- Add payment_requests to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;