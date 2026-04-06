-- Migration 134: Security Hardening
--
-- A) Tighten payment_transactions INSERT policy — replace WITH CHECK (true)
--    so agents can only insert payments for their own leads, admins unrestricted.
-- B) Tighten payment_transactions UPDATE policy — same scoping as INSERT.
-- C) Add GPA range constraint (0–100) on leads.actual_gpa.

-- =============================================================================
-- A) payment_transactions INSERT policy
-- =============================================================================
DROP POLICY IF EXISTS "Users can insert payment transactions" ON payment_transactions;

CREATE POLICY "Users can insert payment transactions"
  ON payment_transactions FOR INSERT TO authenticated
  WITH CHECK (
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- B) payment_transactions UPDATE policy
-- =============================================================================
DROP POLICY IF EXISTS "Users can update payment transactions" ON payment_transactions;

CREATE POLICY "Users can update payment transactions"
  ON payment_transactions FOR UPDATE TO authenticated
  USING (
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    lead_id IN (SELECT id FROM leads WHERE assigned_to = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================================================
-- C) GPA range constraint (idempotent)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'valid_gpa_range'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT valid_gpa_range
      CHECK (actual_gpa IS NULL OR (actual_gpa >= 0 AND actual_gpa <= 100));
  END IF;
END $$;
