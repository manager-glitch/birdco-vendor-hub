-- Add role column to opportunities table to distinguish between chef and vendor gigs
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS role app_role;

-- Set a default value for existing opportunities (you can change these manually later)
UPDATE public.opportunities 
SET role = 'vendor' 
WHERE role IS NULL;

-- Make the role column required going forward
ALTER TABLE public.opportunities 
ALTER COLUMN role SET NOT NULL;

-- Update RLS policy to only show opportunities matching user's role
DROP POLICY IF EXISTS "Vendors can view open opportunities" ON public.opportunities;

CREATE POLICY "Users can view open opportunities for their role"
  ON public.opportunities
  FOR SELECT
  USING (
    (status = 'open' AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND user_roles.role = opportunities.role
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  );