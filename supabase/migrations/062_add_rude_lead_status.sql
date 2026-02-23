-- Add 'rude' lead status value
DO $$
BEGIN
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'rude';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
