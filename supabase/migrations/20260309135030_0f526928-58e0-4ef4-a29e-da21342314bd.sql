
-- Create story_views table
CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own view
CREATE POLICY "Users can record their own views"
ON public.story_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Story owner can see who viewed; viewer can see their own record
CREATE POLICY "Story owner and viewer can see views"
ON public.story_views FOR SELECT TO authenticated
USING (
  viewer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.stories WHERE stories.id = story_views.story_id AND stories.user_id = auth.uid()
  )
);
