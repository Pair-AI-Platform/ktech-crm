-- Migration 118: Add marketing role + created_by tracking on leads
-- Purpose: Allow marketing team members to submit leads and track their own submissions

-- 1. Add 'marketing' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketing';

-- 2. Add created_by column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Index for efficient RLS filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);

-- 3. RLS policies for marketing role

-- Marketing users can see their own submitted leads
CREATE POLICY "marketing_select_own_leads" ON leads
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'marketing'
    AND created_by = auth.uid()
  );

-- Marketing users can insert leads
CREATE POLICY "marketing_insert_leads" ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'marketing'
    AND created_by = auth.uid()
  );
