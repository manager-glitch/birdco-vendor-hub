-- Drop the function first (depends on the view type)
DROP FUNCTION IF EXISTS public.admin_profiles_with_email() CASCADE;

-- Now drop the view
DROP VIEW IF EXISTS public.profiles_with_email CASCADE;

-- Update the get_user_email function with admin check
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN public.has_role(auth.uid(), 'admin') THEN (SELECT email FROM auth.users WHERE id = user_uuid)
      ELSE NULL
    END
$$;