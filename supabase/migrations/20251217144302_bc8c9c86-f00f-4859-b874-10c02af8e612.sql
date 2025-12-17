-- Fix security issues: Add explicit authentication requirements to all tables

-- 1. Add explicit "deny anonymous" policies by requiring auth.uid() IS NOT NULL
-- This ensures anonymous users cannot access any data even if other policies are bypassed

-- Profiles table - ensure only authenticated users can read
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Contact submissions - block anonymous access
CREATE POLICY "Require authentication for contact_submissions"
ON public.contact_submissions
FOR SELECT
TO anon
USING (false);

-- Referrals - block anonymous access
CREATE POLICY "Require authentication for referrals"
ON public.referrals
FOR SELECT
TO anon
USING (false);

-- Push tokens - block anonymous access
CREATE POLICY "Require authentication for push_tokens"
ON public.push_tokens
FOR SELECT
TO anon
USING (false);

-- Vendor documents - block anonymous access
CREATE POLICY "Require authentication for vendor_documents"
ON public.vendor_documents
FOR SELECT
TO anon
USING (false);

-- Messages - block anonymous access
CREATE POLICY "Require authentication for messages"
ON public.messages
FOR SELECT
TO anon
USING (false);

-- Conversations - block anonymous access
CREATE POLICY "Require authentication for conversations"
ON public.conversations
FOR SELECT
TO anon
USING (false);

-- Vendor gallery - block anonymous access (even though bucket is public, table should be protected)
CREATE POLICY "Require authentication for vendor_gallery"
ON public.vendor_gallery
FOR SELECT
TO anon
USING (false);

-- Completed events - block anonymous access
CREATE POLICY "Require authentication for completed_events"
ON public.completed_events
FOR SELECT
TO anon
USING (false);

-- Applications - block anonymous access
CREATE POLICY "Require authentication for applications"
ON public.applications
FOR SELECT
TO anon
USING (false);

-- Opportunities - block anonymous access
CREATE POLICY "Require authentication for opportunities"
ON public.opportunities
FOR SELECT
TO anon
USING (false);

-- User roles - block anonymous access
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- 2. Fix function search_path issues for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;