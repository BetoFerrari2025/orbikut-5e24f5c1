
CREATE TABLE public.engagement_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  dwell_seconds numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_user ON public.engagement_signals(user_id, created_at DESC);
CREATE INDEX idx_engagement_post ON public.engagement_signals(post_id);

ALTER TABLE public.engagement_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own signals"
  ON public.engagement_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own signals"
  ON public.engagement_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
