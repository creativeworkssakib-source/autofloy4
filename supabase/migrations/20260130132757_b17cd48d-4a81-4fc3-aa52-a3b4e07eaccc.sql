-- Enable Realtime for key tables to support live updates
-- This allows Supabase to broadcast changes to subscribed clients

-- First check and drop if already exists, then add (to avoid duplicates)
DO $$
BEGIN
  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  
  -- execution_logs
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'execution_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE execution_logs;
  END IF;
  
  -- ai_orders
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ai_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ai_orders;
  END IF;
  
  -- automations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'automations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE automations;
  END IF;
  
  -- connected_accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'connected_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE connected_accounts;
  END IF;
END
$$;