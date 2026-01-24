-- AI Conversations table to track conversation state
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  conversation_state TEXT DEFAULT 'idle', -- idle, greeting, product_inquiry, collecting_name, collecting_phone, collecting_address, order_confirmation, completed
  current_product_id UUID,
  current_product_name TEXT,
  current_product_price DECIMAL(10,2),
  current_quantity INTEGER DEFAULT 1,
  collected_name TEXT,
  collected_phone TEXT,
  collected_address TEXT,
  fake_order_score INTEGER DEFAULT 0, -- 0-100, higher = more likely fake
  message_history JSONB DEFAULT '[]',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Orders table
CREATE TABLE public.ai_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.ai_conversations(id),
  customer_fb_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]', -- [{product_id, name, price, quantity}]
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cod', -- cod, advance, full_advance
  advance_amount DECIMAL(10,2) DEFAULT 0,
  order_status TEXT DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  fake_order_score INTEGER DEFAULT 0,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_ai_conversations_page_sender ON public.ai_conversations(page_id, sender_id);
CREATE INDEX idx_ai_conversations_state ON public.ai_conversations(conversation_state);
CREATE INDEX idx_ai_orders_page ON public.ai_orders(page_id);
CREATE INDEX idx_ai_orders_status ON public.ai_orders(order_status);
CREATE INDEX idx_ai_orders_invoice ON public.ai_orders(invoice_number);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

CREATE POLICY "Service role can manage all conversations"
ON public.ai_conversations FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for ai_orders
CREATE POLICY "Users can view their own orders" 
ON public.ai_orders FOR SELECT 
USING (user_id IN (SELECT id FROM public.users WHERE id = user_id));

CREATE POLICY "Service role can manage all orders"
ON public.ai_orders FOR ALL
USING (true)
WITH CHECK (true);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  today_str TEXT;
  seq_num INTEGER;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.ai_orders
  WHERE invoice_number LIKE 'INV' || today_str || '%';
  
  new_number := 'INV' || today_str || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_orders_updated_at
  BEFORE UPDATE ON public.ai_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();