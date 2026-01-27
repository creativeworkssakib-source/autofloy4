-- Create an RPC function to fetch dashboard stats directly for a user
-- This bypasses Edge Functions and works even when browser extensions block them

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_messages integer := 0;
  successful_messages integer := 0;
  today_messages integer := 0;
  active_automations integer := 0;
  total_automations integer := 0;
  connected_pages integer := 0;
  today_orders integer := 0;
  today_revenue numeric := 0;
  today_ai_orders integer := 0;
  today_ai_revenue numeric := 0;
  total_ai_orders integer := 0;
  pending_ai_orders integer := 0;
  today_start timestamp with time zone;
BEGIN
  today_start := date_trunc('day', now());
  
  -- Get execution logs stats
  SELECT 
    COUNT(*)::integer,
    COUNT(CASE WHEN status = 'success' THEN 1 END)::integer,
    COUNT(CASE WHEN created_at >= today_start THEN 1 END)::integer
  INTO total_messages, successful_messages, today_messages
  FROM execution_logs
  WHERE user_id = p_user_id;
  
  -- Get automations count
  SELECT 
    COUNT(CASE WHEN is_enabled = true THEN 1 END)::integer,
    COUNT(*)::integer
  INTO active_automations, total_automations
  FROM automations
  WHERE user_id = p_user_id;
  
  -- Get connected pages count
  SELECT COUNT(*)::integer
  INTO connected_pages
  FROM connected_accounts
  WHERE user_id = p_user_id AND is_connected = true;
  
  -- Get today's regular orders
  SELECT 
    COUNT(*)::integer,
    COALESCE(SUM(total), 0)::numeric
  INTO today_orders, today_revenue
  FROM orders
  WHERE user_id = p_user_id AND created_at >= today_start;
  
  -- Get AI orders stats
  SELECT 
    COUNT(CASE WHEN created_at >= today_start THEN 1 END)::integer,
    COALESCE(SUM(CASE WHEN created_at >= today_start THEN total ELSE 0 END), 0)::numeric,
    COUNT(*)::integer,
    COUNT(CASE WHEN order_status = 'pending' THEN 1 END)::integer
  INTO today_ai_orders, today_ai_revenue, total_ai_orders, pending_ai_orders
  FROM ai_orders
  WHERE user_id = p_user_id;
  
  -- Build result
  result := jsonb_build_object(
    'messagesHandled', total_messages,
    'todayMessagesHandled', today_messages,
    'autoRepliesSent', successful_messages,
    'todayAutoReplies', successful_messages, -- For now same as total since we don't track daily
    'successRate', CASE WHEN total_messages > 0 THEN ROUND((successful_messages::numeric / total_messages::numeric) * 100) ELSE 0 END || '%',
    'activeAutomations', active_automations,
    'totalAutomations', total_automations,
    'connectedPages', connected_pages,
    'todayOrders', today_orders + today_ai_orders,
    'todayRevenue', today_revenue + today_ai_revenue,
    'totalAiOrders', total_ai_orders,
    'pendingAiOrders', pending_ai_orders,
    'todayAiOrders', today_ai_orders,
    'todayAiRevenue', today_ai_revenue,
    'hoursSaved', ROUND((total_messages * 2.0) / 60, 1)
  );
  
  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats(uuid) TO anon;