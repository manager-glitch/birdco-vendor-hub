-- Ensure only the two approved emails can ever get an admin role

-- 1) Make sure each user has only ONE role row (prevents .single() failures)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_user_id_unique'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2) Allow users to create/update their own role (vendor/chef), and ONLY allow admin role for the two emails
DROP POLICY IF EXISTS "Users can insert their own role (non-admin)" ON public.user_roles;
CREATE POLICY "Users can insert their own role (non-admin)"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('vendor'::app_role, 'chef'::app_role)
);

DROP POLICY IF EXISTS "Allowed emails can insert admin role" ON public.user_roles;
CREATE POLICY "Allowed emails can insert admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::app_role
  AND (auth.jwt() ->> 'email') IN ('manager@birdandcoevents.co.uk', 'founder@birdandcoevents.co.uk')
);

DROP POLICY IF EXISTS "Users can update their own role (non-admin)" ON public.user_roles;
CREATE POLICY "Users can update their own role (non-admin)"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('vendor'::app_role, 'chef'::app_role)
);

DROP POLICY IF EXISTS "Allowed emails can update own role to admin" ON public.user_roles;
CREATE POLICY "Allowed emails can update own role to admin"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::app_role
  AND (auth.jwt() ->> 'email') IN ('manager@birdandcoevents.co.uk', 'founder@birdandcoevents.co.uk')
);