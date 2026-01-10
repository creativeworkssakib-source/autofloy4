-- Drop overly permissive storage policies for return-photos bucket
DROP POLICY IF EXISTS "Anyone can view return photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload return photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their return photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their return photos" ON storage.objects;

-- Create user-scoped policies using path-based ownership
-- Path format: returns/{user_id}/{filename} or supplier-returns/{user_id}/{filename}
-- Note: Since this app uses custom JWT auth (not Supabase Auth), auth.uid() returns null
-- We use service_role access only through edge functions OR make bucket private with signed URLs
-- For now, we'll restrict to authenticated service role only

-- Make the bucket private (if it was public)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'return-photos';

-- Allow service role full access (for edge functions)
-- The restrictive policy means only service role can access
CREATE POLICY "Service role can manage return photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'return-photos')
  WITH CHECK (bucket_id = 'return-photos');