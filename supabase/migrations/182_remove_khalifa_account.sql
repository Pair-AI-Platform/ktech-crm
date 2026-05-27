-- Migration 182: Remove Khalifa agent account
--
-- Khalifa is not a real agent. This migration:
--   1. Walks every FK column that references profiles(id), and for Khalifa's id
--      either NULLs the column (when nullable) or reassigns it to a fallback
--      admin (when NOT NULL) so the delete won't violate any FK.
--   2. Deletes from auth.users, which cascades to profiles (FK is ON DELETE
--      CASCADE on profiles.id).
--
-- Tables with FK refs to auth.users(id) directly (audit_log, user_preferences,
-- filter_presets, ai_chat, etc.) are handled by their own ON DELETE clauses
-- when the auth.users row is removed.

BEGIN;

DO $$
DECLARE
  khalifa_id UUID := '52bb7f9e-a419-4336-bf1f-53d56eb2f010';
  fallback_admin_id UUID;
  r RECORD;
BEGIN
  -- Bail out cleanly if Khalifa was already removed (makes this migration
  -- safe to re-run / replay against a fresh database).
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = khalifa_id) THEN
    RAISE NOTICE 'Khalifa account % not present — nothing to remove', khalifa_id;
    RETURN;
  END IF;

  -- Pick the oldest active admin (other than Khalifa) to reassign NOT NULL
  -- audit-trail columns to. Falls back to any admin if none are active.
  SELECT id INTO fallback_admin_id
    FROM profiles
   WHERE role = 'admin'
     AND id <> khalifa_id
     AND COALESCE(is_active, true)
   ORDER BY created_at ASC
   LIMIT 1;

  IF fallback_admin_id IS NULL THEN
    SELECT id INTO fallback_admin_id
      FROM profiles
     WHERE role = 'admin' AND id <> khalifa_id
     ORDER BY created_at ASC
     LIMIT 1;
  END IF;

  IF fallback_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin profile available to reassign Khalifa''s NOT NULL refs to';
  END IF;

  -- Walk every FK column that references public.profiles(id) and clean up
  -- Khalifa's references before the cascade delete.
  FOR r IN
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      col.is_nullable
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema    = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
     AND tc.table_schema    = ccu.table_schema
    JOIN information_schema.columns col
      ON col.table_schema = tc.table_schema
     AND col.table_name   = tc.table_name
     AND col.column_name  = kcu.column_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name   = 'profiles'
      AND ccu.column_name  = 'id'
      AND tc.table_name   <> 'profiles'
  LOOP
    IF r.is_nullable = 'YES' THEN
      EXECUTE format(
        'UPDATE %I.%I SET %I = NULL WHERE %I = $1',
        r.table_schema, r.table_name, r.column_name, r.column_name
      ) USING khalifa_id;
    ELSE
      EXECUTE format(
        'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
        r.table_schema, r.table_name, r.column_name, r.column_name
      ) USING fallback_admin_id, khalifa_id;
    END IF;
  END LOOP;

  -- Cascades to public.profiles (profiles.id REFERENCES auth.users(id) ON
  -- DELETE CASCADE) and to any other auth.users(id) refs per their own ON
  -- DELETE clauses.
  DELETE FROM auth.users WHERE id = khalifa_id;

  RAISE NOTICE 'Removed Khalifa (%); orphan audit refs reassigned to admin %',
    khalifa_id, fallback_admin_id;
END $$;

COMMIT;
