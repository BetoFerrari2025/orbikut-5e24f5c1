
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_plan text,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = _user_id
        AND premium_plan IS NOT NULL
        AND (premium_plan = 'vitalicio' OR (premium_until IS NOT NULL AND premium_until > now()))
    );
$$;

CREATE OR REPLACE FUNCTION public.admin_set_premium(_user_id uuid, _plan text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _plan IS NULL OR _plan = 'none' OR _plan = '' THEN
    UPDATE public.profiles SET premium_plan = NULL, premium_until = NULL WHERE id = _user_id;
  ELSIF _plan = 'vitalicio' THEN
    UPDATE public.profiles SET premium_plan = 'vitalicio', premium_until = NULL WHERE id = _user_id;
  ELSIF _plan = 'mensal' THEN
    UPDATE public.profiles SET premium_plan = 'mensal', premium_until = now() + interval '1 month' WHERE id = _user_id;
  ELSIF _plan = 'anual' THEN
    UPDATE public.profiles SET premium_plan = 'anual', premium_until = now() + interval '1 year' WHERE id = _user_id;
  ELSE
    RAISE EXCEPTION 'Invalid plan: %', _plan;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_stats()
RETURNS TABLE(total_users bigint, total_posts bigint, users_today bigint, posts_today bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM auth.users),
    (SELECT count(*) FROM public.posts),
    (SELECT count(*) FROM auth.users WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date),
    (SELECT count(*) FROM public.posts WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)
$$;

CREATE OR REPLACE FUNCTION public.admin_get_signup_stats(_start_date date, _end_date date)
RETURNS TABLE(signup_date date, user_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (created_at AT TIME ZONE 'America/Sao_Paulo')::date as signup_date,
    count(*) as user_count
  FROM auth.users
  WHERE (created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN _start_date AND _end_date
  GROUP BY (created_at AT TIME ZONE 'America/Sao_Paulo')::date
  ORDER BY signup_date
$$;

DROP FUNCTION IF EXISTS public.admin_get_users();
CREATE FUNCTION public.admin_get_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, username text, full_name text, avatar_url text, is_blocked boolean, post_count bigint, premium_plan text, premium_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    au.id, au.email, au.created_at, au.last_sign_in_at,
    p.username, p.full_name, p.avatar_url,
    COALESCE(p.is_blocked, false) as is_blocked,
    (SELECT count(*) FROM public.posts WHERE posts.user_id = au.id) as post_count,
    p.premium_plan, p.premium_until
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC
$$;
