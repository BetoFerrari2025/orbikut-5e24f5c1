
-- Allow users to update their own stories (caption, music_url)
CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
