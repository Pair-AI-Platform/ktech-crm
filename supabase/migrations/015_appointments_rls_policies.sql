-- =============================================
-- APPOINTMENTS RLS POLICIES
-- =============================================
-- The appointments table has RLS enabled but was missing policies

-- Allow all authenticated users to view all appointments
CREATE POLICY appointments_select_policy ON appointments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert appointments
CREATE POLICY appointments_insert_policy ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update appointments they created or are assigned to
CREATE POLICY appointments_update_policy ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_agent = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow users to delete appointments they created (or admins)
CREATE POLICY appointments_delete_policy ON appointments
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
