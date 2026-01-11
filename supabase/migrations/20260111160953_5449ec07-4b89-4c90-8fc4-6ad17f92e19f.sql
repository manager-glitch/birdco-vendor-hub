-- Update the handle_new_user function to auto-assign admin role for allowed emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_email text;
BEGIN
  user_email := NEW.email;
  
  -- Auto-assign admin role for specific emails
  IF user_email IN ('manager@birdandcoevents.co.uk', 'founder@birdandcoevents.co.uk') THEN
    user_role := 'admin';
  ELSE
    -- Get the role from metadata, default to 'vendor' if not provided
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendor');
  END IF;
  
  -- Create profile with registration marked as complete for admins
  IF user_role = 'admin' THEN
    INSERT INTO public.profiles (id, full_name, registration_completed, approval_status)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', true, 'approved');
  ELSE
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;