-- Create storage bucket for demo videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('demo-videos', 'demo-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access for demo videos
CREATE POLICY "Demo videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-videos');

-- Allow authenticated users to upload demo videos (admin only via edge function)
CREATE POLICY "Admins can upload demo videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-videos');

-- Allow authenticated users to update demo videos
CREATE POLICY "Admins can update demo videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'demo-videos');

-- Allow authenticated users to delete demo videos
CREATE POLICY "Admins can delete demo videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'demo-videos');