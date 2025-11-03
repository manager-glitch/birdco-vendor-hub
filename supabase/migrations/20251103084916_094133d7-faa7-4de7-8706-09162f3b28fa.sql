-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own referrals
CREATE POLICY "Vendors can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = vendor_id OR has_role(auth.uid(), 'admin'::app_role));

-- Vendors can insert their own referrals
CREATE POLICY "Vendors can insert their own referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

-- Admins can update referrals
CREATE POLICY "Admins can update referrals"
ON public.referrals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_referrals_vendor_id ON public.referrals(vendor_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);