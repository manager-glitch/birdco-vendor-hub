-- Add 'chef' role to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'chef';

-- Update the handle_new_user function to use role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get the role from metadata, default to 'vendor' if not provided
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendor');
  
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;