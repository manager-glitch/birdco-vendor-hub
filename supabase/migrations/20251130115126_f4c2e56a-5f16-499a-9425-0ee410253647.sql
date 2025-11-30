-- Enable realtime for completed_events table
ALTER TABLE public.completed_events REPLICA IDENTITY FULL;

-- Add completed_events to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.completed_events;