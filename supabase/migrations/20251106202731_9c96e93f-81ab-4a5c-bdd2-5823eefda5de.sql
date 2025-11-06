-- Add read tracking to messages
ALTER TABLE public.messages
ADD COLUMN read_at timestamp with time zone;

-- Create index for better performance on unread messages queries
CREATE INDEX idx_messages_read_at ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- Create a function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_uuid uuid, user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = conversation_uuid
    AND sender_id != user_uuid
    AND read_at IS NULL;
END;
$$;