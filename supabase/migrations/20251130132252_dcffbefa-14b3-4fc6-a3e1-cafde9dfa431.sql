-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));