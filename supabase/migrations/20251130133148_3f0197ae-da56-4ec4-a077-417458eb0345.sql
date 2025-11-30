-- Create vendor gallery storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-gallery', 'vendor-gallery', true);

-- Create vendor gallery table to track images
CREATE TABLE public.vendor_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own gallery
CREATE POLICY "Vendors can view their own gallery"
ON public.vendor_gallery
FOR SELECT
TO authenticated
USING (auth.uid() = vendor_id);

-- Vendors can insert their own gallery images
CREATE POLICY "Vendors can insert their own gallery images"
ON public.vendor_gallery
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = vendor_id);

-- Vendors can update their own gallery images
CREATE POLICY "Vendors can update their own gallery images"
ON public.vendor_gallery
FOR UPDATE
TO authenticated
USING (auth.uid() = vendor_id);

-- Vendors can delete their own gallery images
CREATE POLICY "Vendors can delete their own gallery images"
ON public.vendor_gallery
FOR DELETE
TO authenticated
USING (auth.uid() = vendor_id);

-- Admins can view all galleries
CREATE POLICY "Admins can view all galleries"
ON public.vendor_gallery
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for vendor gallery
CREATE POLICY "Vendors can view their own gallery images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-gallery' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Vendors can upload their own gallery images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can update their own gallery images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete their own gallery images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at
CREATE TRIGGER update_vendor_gallery_updated_at
BEFORE UPDATE ON public.vendor_gallery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();