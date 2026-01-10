-- Add demo video columns to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS demo_video_type text DEFAULT 'youtube' CHECK (demo_video_type IN ('youtube', 'upload')),
ADD COLUMN IF NOT EXISTS demo_video_youtube_url text,
ADD COLUMN IF NOT EXISTS demo_video_upload_url text,
ADD COLUMN IF NOT EXISTS demo_video_enabled boolean DEFAULT false;