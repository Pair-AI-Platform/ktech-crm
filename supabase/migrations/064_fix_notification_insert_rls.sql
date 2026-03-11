-- Fix overly permissive notification INSERT policy
-- Previously: any authenticated user could create notifications for ANY user
-- Now: users can only create notifications where they are the creator (created_by = auth.uid())
-- System-level notifications (e.g. from service role) bypass RLS

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

CREATE POLICY "Users can insert notifications they created"
  ON notifications FOR INSERT
  WITH CHECK (created_by = auth.uid());
