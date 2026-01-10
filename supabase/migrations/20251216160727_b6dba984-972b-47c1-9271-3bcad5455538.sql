-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Users can delete their own orders
CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
USING (auth.uid()::text = user_id::text);