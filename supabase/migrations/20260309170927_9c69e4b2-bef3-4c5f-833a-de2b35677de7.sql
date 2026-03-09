CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);