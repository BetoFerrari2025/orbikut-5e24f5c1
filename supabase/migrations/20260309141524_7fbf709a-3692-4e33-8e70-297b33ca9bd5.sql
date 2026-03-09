
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add is_blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Admin function to get all users with details (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  username text,
  full_name text,
  avatar_url text,
  is_blocked boolean,
  post_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    p.username,
    p.full_name,
    p.avatar_url,
    COALESCE(p.is_blocked, false) as is_blocked,
    (SELECT count(*) FROM public.posts WHERE posts.user_id = au.id) as post_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC
$$;

-- Admin function to delete a user's post
CREATE OR REPLACE FUNCTION public.admin_delete_post(_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.posts WHERE id = _post_id;
END;
$$;

-- Admin function to toggle block user
CREATE OR REPLACE FUNCTION public.admin_toggle_block_user(_user_id uuid, _blocked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.profiles SET is_blocked = _blocked WHERE id = _user_id;
END;
$$;

-- Admin function to delete user (removes from auth.users which cascades)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Admin stats function
CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS TABLE (
  total_users bigint,
  total_posts bigint,
  users_today bigint,
  posts_today bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM auth.users) as total_users,
    (SELECT count(*) FROM public.posts) as total_posts,
    (SELECT count(*) FROM auth.users WHERE created_at >= CURRENT_DATE) as users_today,
    (SELECT count(*) FROM public.posts WHERE created_at >= CURRENT_DATE) as posts_today
$$;

-- Admin function to get user signup stats by date range
CREATE OR REPLACE FUNCTION public.admin_get_signup_stats(_start_date date, _end_date date)
RETURNS TABLE (
  signup_date date,
  user_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(created_at) as signup_date,
    count(*) as user_count
  FROM auth.users
  WHERE DATE(created_at) BETWEEN _start_date AND _end_date
  GROUP BY DATE(created_at)
  ORDER BY signup_date
$$;
