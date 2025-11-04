-- Add registration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS service_category TEXT,
ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-documents', 
  'vendor-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Create vendor_documents table
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'public_liability_insurance',
    'hygiene_rating',
    'food_safety_certificate',
    'allergen_information',
    'signed_contract'
  )),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  notes TEXT,
  UNIQUE(vendor_id, document_type)
);

-- Enable RLS
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_documents
CREATE POLICY "Vendors can view their own documents"
  ON public.vendor_documents
  FOR SELECT
  USING (auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can insert their own documents"
  ON public.vendor_documents
  FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own documents"
  ON public.vendor_documents
  FOR UPDATE
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can update any documents"
  ON public.vendor_documents
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Storage policies for vendor-documents bucket
CREATE POLICY "Vendors can upload their own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'vendor-documents' 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Vendors can update their own documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'vendor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Vendors can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'vendor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to check if registration is complete
CREATE OR REPLACE FUNCTION public.is_registration_complete(vendor_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_docs TEXT[] := ARRAY[
    'public_liability_insurance',
    'hygiene_rating',
    'food_safety_certificate',
    'allergen_information',
    'signed_contract'
  ];
  uploaded_docs INTEGER;
BEGIN
  -- Check if profile is completed
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = vendor_uuid 
    AND full_name IS NOT NULL 
    AND company_name IS NOT NULL 
    AND phone IS NOT NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if all required documents are uploaded
  SELECT COUNT(DISTINCT document_type) INTO uploaded_docs
  FROM vendor_documents
  WHERE vendor_id = vendor_uuid
  AND document_type = ANY(required_docs);
  
  RETURN uploaded_docs = array_length(required_docs, 1);
END;
$$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);