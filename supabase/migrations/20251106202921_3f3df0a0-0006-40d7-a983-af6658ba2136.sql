-- Fix search path for mark_messages_as_read function
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conversation_uuid uuid, user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = conversation_uuid
    AND sender_id != user_uuid
    AND read_at IS NULL;
END;
$$;