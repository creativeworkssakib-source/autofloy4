-- =============================================
-- DATA OPTIMIZATION: Reduce database size and egress
-- =============================================

-- 1. Add index on ai_conversations for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message 
ON public.ai_conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated 
ON public.ai_conversations(updated_at);

-- 2. Create function to cleanup processed message buffers (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_processed_message_buffers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM ai_message_buffer 
  WHERE is_processed = true 
    AND last_message_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 3. Create function to trim old conversation message histories
-- Keeps last 20 messages, summarizes the rest
CREATE OR REPLACE FUNCTION public.trim_old_conversation_histories()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trimmed_count integer := 0;
  conv RECORD;
  msg_history jsonb;
  msg_count integer;
  trimmed_history jsonb;
BEGIN
  -- Process conversations older than 7 days with large message histories
  FOR conv IN 
    SELECT id, message_history 
    FROM ai_conversations 
    WHERE updated_at < NOW() - INTERVAL '7 days'
      AND message_history IS NOT NULL
      AND jsonb_array_length(message_history) > 20
  LOOP
    msg_history := conv.message_history;
    msg_count := jsonb_array_length(msg_history);
    
    -- Keep only last 15 messages for old conversations
    IF msg_count > 15 THEN
      trimmed_history := (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(msg_history) WITH ORDINALITY AS t(elem, ord)
          ORDER BY ord DESC
          LIMIT 15
        ) sub
      );
      
      UPDATE ai_conversations 
      SET message_history = trimmed_history,
          customer_summary = COALESCE(customer_summary, '') || ' [পুরাতন ' || (msg_count - 15) || ' টি মেসেজ আর্কাইভ করা হয়েছে]'
      WHERE id = conv.id;
      
      trimmed_count := trimmed_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('trimmed_conversations', trimmed_count);
END;
$$;

-- 4. Create function to cleanup very old conversations (archive summary only)
CREATE OR REPLACE FUNCTION public.archive_old_conversations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  archived_count integer := 0;
BEGIN
  -- For conversations older than 90 days, keep only essential data
  UPDATE ai_conversations
  SET 
    message_history = '[]'::jsonb,
    customer_summary = COALESCE(customer_summary, '') || ' [90+ দিন পুরানো - সম্পূর্ণ আর্কাইভ করা হয়েছে]'
  WHERE updated_at < NOW() - INTERVAL '90 days'
    AND message_history IS NOT NULL
    AND jsonb_array_length(message_history) > 0;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN jsonb_build_object('archived_conversations', archived_count);
END;
$$;

-- 5. Update execution logs cleanup to be more aggressive
CREATE OR REPLACE FUNCTION public.cleanup_old_execution_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete logs older than 14 days (reduced from 30)
  DELETE FROM execution_logs 
  WHERE created_at < NOW() - INTERVAL '14 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % old execution logs (older than 14 days)', deleted_count;
  END IF;
  
  -- Keep only latest 200 per user (reduced from 500)
  WITH ranked_logs AS (
    SELECT id, user_id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM execution_logs
  )
  DELETE FROM execution_logs 
  WHERE id IN (
    SELECT id FROM ranked_logs WHERE rn > 200
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % excess logs (keeping max 200 per user)', deleted_count;
  END IF;
END;
$$;

-- 6. Create master cleanup function that runs all cleanups
CREATE OR REPLACE FUNCTION public.run_all_data_cleanups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  buffer_cleaned integer;
  trim_result jsonb;
  archive_result jsonb;
BEGIN
  -- 1. Cleanup message buffers
  SELECT cleanup_processed_message_buffers() INTO buffer_cleaned;
  
  -- 2. Trim old conversation histories
  SELECT trim_old_conversation_histories() INTO trim_result;
  
  -- 3. Archive very old conversations
  SELECT archive_old_conversations() INTO archive_result;
  
  -- 4. Cleanup execution logs
  PERFORM cleanup_old_execution_logs();
  
  RETURN jsonb_build_object(
    'message_buffers_cleaned', buffer_cleaned,
    'conversations_trimmed', trim_result->'trimmed_conversations',
    'conversations_archived', archive_result->'archived_conversations',
    'cleanup_time', NOW()
  );
END;
$$;