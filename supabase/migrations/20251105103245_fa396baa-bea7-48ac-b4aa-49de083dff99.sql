-- Create completed_events table
CREATE TABLE public.completed_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  opportunity_id UUID,
  event_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  notes TEXT,
  event_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.completed_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Vendors can view their own completed events"
ON public.completed_events
FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can insert their own completed events"
ON public.completed_events
FOR INSERT
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own completed events"
ON public.completed_events
FOR UPDATE
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own completed events"
ON public.completed_events
FOR DELETE
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all completed events"
ON public.completed_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all completed events"
ON public.completed_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_completed_events_updated_at
BEFORE UPDATE ON public.completed_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_completed_events_vendor_id ON public.completed_events(vendor_id);
CREATE INDEX idx_completed_events_event_date ON public.completed_events(event_date DESC);