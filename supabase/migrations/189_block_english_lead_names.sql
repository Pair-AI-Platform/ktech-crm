-- Prevent future lead writes from storing English/Latin names.
-- Existing historical rows are not rewritten here; the trigger blocks inserts
-- and name-field changes while allowing unrelated updates to old rows.

CREATE OR REPLACE FUNCTION public.enforce_no_english_lead_names()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.first_name IS DISTINCT FROM OLD.first_name THEN
    IF NEW.first_name IS NOT NULL AND btrim(NEW.first_name) <> '' AND NEW.first_name ~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Lead first_name must be Arabic only' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.last_name IS DISTINCT FROM OLD.last_name THEN
    IF NEW.last_name IS NOT NULL AND btrim(NEW.last_name) <> '' AND NEW.last_name ~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Lead last_name must be Arabic only' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.first_name_ar IS DISTINCT FROM OLD.first_name_ar THEN
    IF NEW.first_name_ar IS NOT NULL AND btrim(NEW.first_name_ar) <> '' AND NEW.first_name_ar ~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Lead first_name_ar must be Arabic only' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.last_name_ar IS DISTINCT FROM OLD.last_name_ar THEN
    IF NEW.last_name_ar IS NOT NULL AND btrim(NEW.last_name_ar) <> '' AND NEW.last_name_ar ~ '[A-Za-z]' THEN
      RAISE EXCEPTION 'Lead last_name_ar must be Arabic only' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_no_english_lead_names ON public.leads;

CREATE TRIGGER trg_enforce_no_english_lead_names
BEFORE INSERT OR UPDATE OF first_name, last_name, first_name_ar, last_name_ar
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.enforce_no_english_lead_names();
