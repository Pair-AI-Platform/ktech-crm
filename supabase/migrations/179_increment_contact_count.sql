-- Atomic increment for leads.contact_count and stamp last_contacted_at.
-- Replaces a client-side read-then-write that raced under concurrent calls
-- (lib/hooks/use-leads.ts::incrementContactCount).
-- Idempotent: safe to re-apply (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION increment_contact_count(lead_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
AS $$
  UPDATE leads
  SET
    contact_count = COALESCE(contact_count, 0) + 1,
    last_contacted_at = NOW()
  WHERE id = lead_id;
$$;

-- Allow authenticated callers (agents + admins) to invoke. RLS on the
-- underlying leads table still gates which rows actually get updated.
REVOKE ALL ON FUNCTION increment_contact_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_contact_count(uuid) TO authenticated;
