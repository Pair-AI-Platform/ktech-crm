-- Add new lead status values for the contacted stage
-- New statuses: interested, high_gpa, low_gpa, already_done

-- Add new values to lead_status enum (if it's still an enum)
-- If status column is text, these are just frontend-managed values
DO $$
BEGIN
  -- Try adding enum values (will silently skip if column is text or values already exist)
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'interested';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'high_gpa';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'low_gpa';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'already_done';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
