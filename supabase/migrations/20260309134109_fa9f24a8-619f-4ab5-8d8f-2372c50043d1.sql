
-- Create storage bucket for story music
INSERT INTO storage.buckets (id, name, public) VALUES ('story-music', 'story-music', true);

-- Allow authenticated users to upload music
CREATE POLICY "Authenticated users can upload music"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'story-music' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Anyone can view story music"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'story-music');

-- Allow users to delete their own music
CREATE POLICY "Users can delete own music"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'story-music' AND (storage.foldername(name))[1] = auth.uid()::text);
