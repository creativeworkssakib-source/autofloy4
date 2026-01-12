-- Fix payment_requests security: Drop overly permissive policies and deny direct client access

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Allow updates on payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Allow authenticated inserts on payment_requests" ON payment_requests;

-- Create restrictive policy - deny all direct client access
-- All access should go through edge functions with service role
CREATE POLICY "Deny direct client access to payment_requests"
ON payment_requests FOR ALL USING (false);