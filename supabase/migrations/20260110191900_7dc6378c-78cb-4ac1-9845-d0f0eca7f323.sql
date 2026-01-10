-- Add admin policies for payment_requests using user_roles table

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests" 
ON public.payment_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id::text = auth.uid()::text 
    AND user_roles.role = 'admin'
  )
);

-- Admins can update payment requests (approve/reject)
CREATE POLICY "Admins can update payment requests" 
ON public.payment_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id::text = auth.uid()::text 
    AND user_roles.role = 'admin'
  )
);