ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS caption_x numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS caption_y numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS caption_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS caption_size integer DEFAULT 14,
  ADD COLUMN IF NOT EXISTS filter_brightness numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS filter_contrast numeric DEFAULT 100,
  ADD COLUMN IF NOT EXISTS filter_saturation numeric DEFAULT 100;