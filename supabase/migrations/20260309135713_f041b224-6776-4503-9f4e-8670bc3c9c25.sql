
-- Highlights: groups of saved stories on a user's profile
CREATE TABLE public.story_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Destaque',
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlights are viewable by everyone"
ON public.story_highlights FOR SELECT USING (true);

CREATE POLICY "Users can create their own highlights"
ON public.story_highlights FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
ON public.story_highlights FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
ON public.story_highlights FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Junction table: stories in a highlight
CREATE TABLE public.story_highlight_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (highlight_id, story_id)
);

ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Highlight items are viewable by everyone"
ON public.story_highlight_items FOR SELECT USING (true);

CREATE POLICY "Users can add items to their highlights"
ON public.story_highlight_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.story_highlights
    WHERE id = story_highlight_items.highlight_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove items from their highlights"
ON public.story_highlight_items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.story_highlights
    WHERE id = story_highlight_items.highlight_id AND user_id = auth.uid()
  )
);
