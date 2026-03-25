-- Fix: Re-create appointments SELECT policy
-- The original policy (migration 015) may have been dropped via the Dashboard
DROP POLICY IF EXISTS appointments_select_policy ON appointments;
CREATE POLICY appointments_select_policy ON appointments
  FOR SELECT
  TO authenticated
  USING (true);
