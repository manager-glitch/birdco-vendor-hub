-- Enable realtime for applications table
ALTER TABLE public.applications REPLICA IDENTITY FULL;

-- Add applications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;