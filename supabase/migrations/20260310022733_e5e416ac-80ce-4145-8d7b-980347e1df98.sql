CREATE POLICY "Anyone can view admin roles"
ON public.user_roles
FOR SELECT
TO public
USING (role = 'admin');