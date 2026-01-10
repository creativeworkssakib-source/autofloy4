-- Drop overly permissive policies
DROP POLICY IF EXISTS "Admins can upload demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update demo videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete demo videos" ON storage.objects;

-- Create stricter policies that require authentication
CREATE POLICY "Authenticated users can upload demo videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demo-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update demo videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'demo-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete demo videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'demo-videos' AND auth.role() = 'authenticated');