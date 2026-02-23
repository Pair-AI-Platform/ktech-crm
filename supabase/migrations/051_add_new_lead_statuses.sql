-- Add new lead status values: contacted, seeking_job, current_student, asking_bachelors, courses_masters
DO $$
BEGIN
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'contacted';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'seeking_job';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'current_student';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'asking_bachelors';
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'courses_masters';
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
