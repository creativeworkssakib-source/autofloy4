-- Create a function to clean up old execution logs (keep only last 30 days or max 500 per user)
CREATE OR REPLACE FUNCTION cleanup_old_execution_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM execution_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % old execution logs (older than 30 days)', deleted_count;
  END IF;
  
  -- Also delete excess logs per user (keep only latest 500 per user)
  WITH ranked_logs AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM execution_logs
  )
  DELETE FROM execution_logs 
  WHERE id IN (
    SELECT id FROM ranked_logs WHERE rn > 500
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % excess logs (keeping max 500 per user)', deleted_count;
  END IF;
END;
$$;

-- Create a scheduled job to run cleanup daily (if pg_cron is available)
-- This will be called by a cron edge function