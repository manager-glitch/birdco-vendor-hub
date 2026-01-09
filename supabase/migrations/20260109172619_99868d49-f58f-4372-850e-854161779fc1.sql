-- Add guest_count column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN guest_count integer;