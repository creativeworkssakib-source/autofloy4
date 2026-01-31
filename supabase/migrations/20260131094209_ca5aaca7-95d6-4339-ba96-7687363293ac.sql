-- Create unique partial index to prevent duplicate unprocessed buffers per sender/page
-- This ensures only ONE active buffer can exist at database level
DROP INDEX IF EXISTS idx_ai_message_buffer_unique_active;

CREATE UNIQUE INDEX idx_ai_message_buffer_unique_active 
ON ai_message_buffer (page_id, sender_id) 
WHERE is_processed = false;