
-- Add streak tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_post_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_streak integer DEFAULT 0;

-- Create story_polls table
CREATE TABLE IF NOT EXISTS public.story_polls (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create story_poll_votes table
CREATE TABLE IF NOT EXISTS public.story_poll_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES public.story_polls(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  selected_option text NOT NULL CHECK (selected_option IN ('A', 'B')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.story_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for story_polls
CREATE POLICY "Story polls are viewable by everyone" ON public.story_polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls for their own stories" ON public.story_polls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
);

-- RLS policies for story_poll_votes  
CREATE POLICY "Poll votes are viewable by everyone" ON public.story_poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.story_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update streak on new post
CREATE OR REPLACE FUNCTION public.update_post_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_date date;
  current_str integer;
BEGIN
  SELECT last_post_date, current_streak INTO last_date, current_str
  FROM public.profiles WHERE id = NEW.user_id;
  
  IF last_date IS NULL OR last_date < CURRENT_DATE - 1 THEN
    -- Reset streak
    UPDATE public.profiles 
    SET current_streak = 1, last_post_date = CURRENT_DATE,
        max_streak = GREATEST(max_streak, 1)
    WHERE id = NEW.user_id;
  ELSIF last_date = CURRENT_DATE - 1 THEN
    -- Continue streak
    UPDATE public.profiles 
    SET current_streak = current_streak + 1, last_post_date = CURRENT_DATE,
        max_streak = GREATEST(max_streak, current_streak + 1)
    WHERE id = NEW.user_id;
  ELSIF last_date < CURRENT_DATE THEN
    -- Same day, no change needed but update date
    UPDATE public.profiles SET last_post_date = CURRENT_DATE WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
DROP TRIGGER IF EXISTS on_post_created_update_streak ON public.posts;
CREATE TRIGGER on_post_created_update_streak
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_streak();

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_poll_votes;
