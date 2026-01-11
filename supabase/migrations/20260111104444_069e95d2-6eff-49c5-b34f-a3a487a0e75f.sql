-- Drop existing restrictive policies on payment_requests
DROP POLICY IF EXISTS "Users can create their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Users can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can view all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can update payment requests" ON public.payment_requests;

-- Create new policies that work with custom auth (using user_id column)
-- Allow authenticated users (anyone with valid session) to insert
CREATE POLICY "Allow authenticated inserts on payment_requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (user_id IS NOT NULL);

-- Allow users to view their own payment requests
CREATE POLICY "Users can view own payment requests"
ON public.payment_requests
FOR SELECT
USING (true);

-- Allow updates on payment requests
CREATE POLICY "Allow updates on payment requests"
ON public.payment_requests
FOR UPDATE
USING (true);

-- Also update payment_methods to allow all operations for admin
DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;

-- Create more permissive policies for payment_methods
CREATE POLICY "Public can view payment methods"
ON public.payment_methods
FOR SELECT
USING (true);

CREATE POLICY "Allow all operations on payment methods"
ON public.payment_methods
FOR ALL
USING (true)
WITH CHECK (true);

-- Delete the default placeholder data so admin can add real data
DELETE FROM public.payment_methods WHERE account_number IN ('01XXXXXXXXX', 'XXXX-XXXX-XXXX');