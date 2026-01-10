-- Fix RLS policies for user_roles table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage all roles" ON user_roles;

-- Create a restrictive policy that denies all client access for INSERT/UPDATE/DELETE
CREATE POLICY "Deny client write access to user_roles" 
ON user_roles 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Keep the SELECT policy for users to see their own role (already exists)

-- Fix RLS policies for webhook_configs table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage webhook configs" ON webhook_configs;

-- Create a restrictive policy that denies all client access for INSERT/UPDATE/DELETE
CREATE POLICY "Deny client write access to webhook_configs" 
ON webhook_configs 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Deny client update access to webhook_configs" 
ON webhook_configs 
FOR UPDATE 
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny client delete access to webhook_configs" 
ON webhook_configs 
FOR DELETE 
USING (false);

-- Keep the SELECT policy (Anyone can read webhook configs - already exists)