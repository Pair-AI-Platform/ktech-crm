-- Ensure notifications table has all required columns
-- The original migration (054) uses 'body' and 'created_by'
-- Migration 141 used 'message' without 'created_by' in its IF NOT EXISTS fallback
-- This migration ensures both columns exist regardless of which CREATE ran first

-- Add 'body' column if missing (migration 141 used 'message' instead)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'body'
  ) THEN
    ALTER TABLE notifications ADD COLUMN body TEXT;

    -- If 'message' column exists, migrate its data to 'body'
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notifications' AND column_name = 'message'
    ) THEN
      UPDATE notifications SET body = message WHERE message IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Add 'created_by' column if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE notifications ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Add missing columns that may not exist from migration 141's simpler schema
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN student_id UUID REFERENCES students(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Drop the overly restrictive type CHECK constraint and replace with a broader one
-- This allows 'priority_reminder' and future types
DO $$ BEGIN
  -- Try to drop existing check constraint (name varies by how it was created)
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'new_assignment', 'appointment_reminder', 'payment_received',
      'stage_change', 'system_alert', 'priority_reminder'
    ));
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Ensure RLS insert policy allows service role and admin inserts
DROP POLICY IF EXISTS "Users can insert notifications they created" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    OR created_by IS NULL
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

NOTIFY pgrst, 'reload schema';
