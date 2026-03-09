ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS link_x numeric DEFAULT 50;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS link_y numeric DEFAULT 50;