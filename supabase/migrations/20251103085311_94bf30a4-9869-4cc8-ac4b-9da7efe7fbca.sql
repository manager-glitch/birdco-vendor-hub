-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own submissions
CREATE POLICY "Vendors can view their own submissions"
ON public.contact_submissions
FOR SELECT
USING (auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));

-- Vendors can insert their own submissions
CREATE POLICY "Vendors can insert their own submissions"
ON public.contact_submissions
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for performance
CREATE INDEX idx_contact_submissions_vendor_id ON public.contact_submissions(vendor_id);
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);