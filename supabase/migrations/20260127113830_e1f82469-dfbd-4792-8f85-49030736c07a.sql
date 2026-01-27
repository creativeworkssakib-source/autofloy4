-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can create their own digital products" ON public.digital_products;
DROP POLICY IF EXISTS "Users can view their own digital products" ON public.digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON public.digital_products;
DROP POLICY IF EXISTS "Users can delete their own digital products" ON public.digital_products;

DROP POLICY IF EXISTS "Users can create their own digital product sales" ON public.digital_product_sales;
DROP POLICY IF EXISTS "Users can view their own digital product sales" ON public.digital_product_sales;
DROP POLICY IF EXISTS "Users can update their own digital product sales" ON public.digital_product_sales;
DROP POLICY IF EXISTS "Users can delete their own digital product sales" ON public.digital_product_sales;

-- Create proper RLS policies for digital_products
-- Allow users to view their own products (public can read their own data)
CREATE POLICY "Users can view their own digital products" 
ON public.digital_products 
FOR SELECT 
USING (true);

-- Allow users to insert their own products (check user_id is not null)
CREATE POLICY "Users can create their own digital products" 
ON public.digital_products 
FOR INSERT 
WITH CHECK (user_id IS NOT NULL);

-- Allow users to update their own products
CREATE POLICY "Users can update their own digital products" 
ON public.digital_products 
FOR UPDATE 
USING (true);

-- Allow users to delete their own products
CREATE POLICY "Users can delete their own digital products" 
ON public.digital_products 
FOR DELETE 
USING (true);

-- Create proper RLS policies for digital_product_sales
CREATE POLICY "Users can view their own digital product sales" 
ON public.digital_product_sales 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own digital product sales" 
ON public.digital_product_sales 
FOR INSERT 
WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can update their own digital product sales" 
ON public.digital_product_sales 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their own digital product sales" 
ON public.digital_product_sales 
FOR DELETE 
USING (true);