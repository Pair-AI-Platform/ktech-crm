-- Add 'user' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';

-- Update RLS policies to handle the new 'user' role
-- Users with 'user' role should not see any leads
DROP POLICY IF EXISTS leads_select_policy ON leads;
CREATE POLICY leads_select_policy ON leads
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users with 'user' role cannot insert leads
DROP POLICY IF EXISTS leads_insert_policy ON leads;
CREATE POLICY leads_insert_policy ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'agent'))
  );

-- Users with 'user' role cannot update leads
DROP POLICY IF EXISTS leads_update_policy ON leads;
CREATE POLICY leads_update_policy ON leads
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users with 'user' role cannot delete leads
DROP POLICY IF EXISTS leads_delete_policy ON leads;
CREATE POLICY leads_delete_policy ON leads
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Activity log: user role can only see their own activities (which will be none)
DROP POLICY IF EXISTS activities_select_policy ON activities;
CREATE POLICY activities_select_policy ON activities
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
