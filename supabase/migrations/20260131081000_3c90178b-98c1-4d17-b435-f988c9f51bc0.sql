-- Add unique constraint to prevent multiple buffers per sender per page
-- First, clean up any duplicate buffers
DELETE FROM ai_message_buffer a
WHERE a.is_processed = false
  AND a.id NOT IN (
    SELECT DISTINCT ON (page_id, sender_id) id
    FROM ai_message_buffer
    WHERE is_processed = false
    ORDER BY page_id, sender_id, created_at ASC
  );

-- Create unique partial index for unprocessed buffers only
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_buffer 
ON ai_message_buffer (page_id, sender_id) 
WHERE is_processed = false;