
CREATE TABLE public.profile_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile links are viewable by everyone" ON public.profile_links FOR SELECT USING (true);
CREATE POLICY "Users can manage their own links" ON public.profile_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own links" ON public.profile_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own links" ON public.profile_links FOR DELETE TO authenticated USING (auth.uid() = user_id);
