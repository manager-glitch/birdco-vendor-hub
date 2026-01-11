-- Create junction table for tagged profiles on opportunities
CREATE TABLE public.opportunity_tagged_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.opportunity_tagged_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can manage tagged profiles
CREATE POLICY "Admins can manage tagged profiles"
ON public.opportunity_tagged_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tagged users can view their own tags
CREATE POLICY "Users can view their own tags"
ON public.opportunity_tagged_profiles
FOR SELECT
USING (auth.uid() = profile_id);

-- Base deny policy
CREATE POLICY "Require authentication for opportunity_tagged_profiles"
ON public.opportunity_tagged_profiles
FOR SELECT
USING (false);