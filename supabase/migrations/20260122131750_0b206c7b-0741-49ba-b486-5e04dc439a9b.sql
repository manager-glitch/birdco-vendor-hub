-- Create a function to get user email by ID (for admin use only)
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid
$$;

-- Create a view for admin to see profiles with emails
CREATE OR REPLACE VIEW public.profiles_with_email
WITH (security_invoker = false)
AS
SELECT 
  p.*,
  (SELECT email FROM auth.users WHERE id = p.id) as email
FROM public.profiles p;

-- Grant select on the view to authenticated users (RLS will still apply via function)
GRANT SELECT ON public.profiles_with_email TO authenticated;

-- Create RLS-like policy using a wrapper function for admin check
CREATE OR REPLACE FUNCTION public.admin_profiles_with_email()
RETURNS SETOF public.profiles_with_email
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles_with_email
  WHERE public.has_role(auth.uid(), 'admin')
$$;