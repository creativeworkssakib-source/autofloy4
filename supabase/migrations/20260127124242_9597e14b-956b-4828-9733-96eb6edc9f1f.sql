-- Create RPC function to get execution logs for a user (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_execution_logs(p_user_id uuid, p_limit integer DEFAULT 500)
RETURNS TABLE (
  id uuid,
  event_type text,
  status text,
  source_platform text,
  processing_time_ms integer,
  created_at timestamptz,
  automation_id uuid,
  incoming_payload jsonb,
  response_payload jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id,
    el.event_type::text,
    el.status::text,
    el.source_platform::text,
    el.processing_time_ms,
    el.created_at,
    el.automation_id,
    el.incoming_payload,
    el.response_payload
  FROM execution_logs el
  WHERE el.user_id = p_user_id
  ORDER BY el.created_at DESC
  LIMIT p_limit;
END;
$$;