-- Marketing system tables

-- WhatsApp connected accounts for marketing
CREATE TABLE IF NOT EXISTS marketing_whatsapp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  phone_number TEXT,
  session_data JSONB,
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collected phone numbers from groups or leads
CREATE TABLE IF NOT EXISTS marketing_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  source TEXT NOT NULL, -- 'whatsapp_group', 'google_maps', 'manual', 'bulk_import'
  source_name TEXT, -- group name or business name
  has_whatsapp BOOLEAN,
  is_validated BOOLEAN DEFAULT false,
  validation_date TIMESTAMPTZ,
  contact_name TEXT,
  business_name TEXT,
  address TEXT,
  category TEXT,
  notes TEXT,
  tags TEXT[],
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp groups discovered
CREATE TABLE IF NOT EXISTS marketing_whatsapp_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES marketing_whatsapp_accounts(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL,
  group_name TEXT,
  member_count INTEGER DEFAULT 0,
  numbers_extracted INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bulk message campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  account_id UUID REFERENCES marketing_whatsapp_accounts(id),
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'document'
  target_numbers TEXT[],
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'failed'
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaign message logs
CREATE TABLE IF NOT EXISTS marketing_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fraud detection - suspicious orders and IPs
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  order_id UUID,
  detection_type TEXT NOT NULL, -- 'fake_ip', 'fake_order', 'suspicious_pattern', 'blacklisted'
  risk_score INTEGER DEFAULT 0, -- 0-100
  ip_address TEXT,
  phone_number TEXT,
  customer_name TEXT,
  details JSONB,
  is_blocked BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incomplete orders / abandoned carts for retargeting
CREATE TABLE IF NOT EXISTS incomplete_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_name TEXT,
  phone_number TEXT,
  email TEXT,
  address TEXT,
  cart_items JSONB,
  cart_total NUMERIC DEFAULT 0,
  step_reached TEXT, -- 'cart', 'info', 'address', 'payment'
  source_url TEXT,
  ip_address TEXT,
  device_info JSONB,
  is_retargeted BOOLEAN DEFAULT false,
  retarget_count INTEGER DEFAULT 0,
  last_retargeted_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blacklisted IPs and phone numbers
CREATE TABLE IF NOT EXISTS marketing_blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'ip', 'phone', 'email'
  value TEXT NOT NULL,
  reason TEXT,
  blocked_orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketing_whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomplete_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their whatsapp accounts" ON marketing_whatsapp_accounts FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their phone numbers" ON marketing_phone_numbers FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their whatsapp groups" ON marketing_whatsapp_groups FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their campaigns" ON marketing_campaigns FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their message logs" ON marketing_message_logs FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their fraud logs" ON fraud_detection_logs FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their incomplete orders" ON incomplete_orders FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their blacklist" ON marketing_blacklist FOR ALL USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_marketing_phone_numbers_user ON marketing_phone_numbers(user_id);
CREATE INDEX idx_marketing_phone_numbers_shop ON marketing_phone_numbers(shop_id);
CREATE INDEX idx_marketing_phone_numbers_source ON marketing_phone_numbers(source);
CREATE INDEX idx_marketing_campaigns_user ON marketing_campaigns(user_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_fraud_detection_user ON fraud_detection_logs(user_id);
CREATE INDEX idx_fraud_detection_type ON fraud_detection_logs(detection_type);
CREATE INDEX idx_incomplete_orders_user ON incomplete_orders(user_id);
CREATE INDEX idx_incomplete_orders_converted ON incomplete_orders(converted);

-- Triggers for updated_at
CREATE TRIGGER update_marketing_whatsapp_accounts_updated_at BEFORE UPDATE ON marketing_whatsapp_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_phone_numbers_updated_at BEFORE UPDATE ON marketing_phone_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incomplete_orders_updated_at BEFORE UPDATE ON incomplete_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();