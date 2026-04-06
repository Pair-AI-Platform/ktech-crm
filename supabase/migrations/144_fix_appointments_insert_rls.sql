-- Fix: Re-create appointments INSERT policy
-- The original policy (migration 015) was likely dropped via the Supabase Dashboard
DROP POLICY IF EXISTS appointments_insert_policy ON appointments;
CREATE POLICY appointments_insert_policy ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
