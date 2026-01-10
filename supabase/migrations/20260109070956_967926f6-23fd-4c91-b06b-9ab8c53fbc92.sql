-- Add notification_type column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing notifications with appropriate types
UPDATE notifications SET notification_type = 'success' WHERE title ILIKE '%enabled%';
UPDATE notifications SET notification_type = 'warning' WHERE title ILIKE '%disabled%';
UPDATE notifications SET notification_type = 'info' WHERE notification_type IS NULL;