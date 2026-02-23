-- Add new lead status values for the appointment stage: on_the_way (OTW) and cant_reach
DO $$
BEGIN
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'on_the_way';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'cant_reach';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
