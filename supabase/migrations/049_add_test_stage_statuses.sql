-- Add new lead status values for the test stage: online and on_campus
DO $$
BEGIN
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'online';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'on_campus';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
