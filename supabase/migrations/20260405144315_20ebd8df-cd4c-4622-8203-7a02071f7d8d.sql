CREATE TABLE public.link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record link clicks"
ON public.link_clicks FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view link clicks"
ON public.link_clicks FOR SELECT TO public
USING (true);

CREATE INDEX idx_link_clicks_post_id ON public.link_clicks(post_id);