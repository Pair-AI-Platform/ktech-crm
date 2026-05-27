-- Migration 181: Trigram indexes for lead search
--
-- The /api/leads route runs `.or(first_name.ilike.%q%, last_name.ilike.%q%,
-- phone.ilike.%q%, civil_id.ilike.%q%)` on every search keystroke. Without
-- trigram indexes, leading-wildcard ILIKE falls back to a full sequential
-- scan of the leads table — the primary cause of slow search at 15k+ rows.
--
-- pg_trgm + GIN indexes let Postgres serve ILIKE '%substring%' from the
-- index. Per-column GIN indexes keep things simple and let the planner pick
-- whichever set of columns the query touches.
--
-- Each block is wrapped so a missing column or pre-existing extension
-- doesn't abort the migration.

DO $idx$
BEGIN
  -- Ensure the trigram extension is available. CREATE EXTENSION IF NOT
  -- EXISTS is idempotent.
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip pg_trgm extension: %', SQLERRM;
  END;

  -- 1. leads.first_name (case-insensitive substring search)
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_first_name_trgm
      ON leads USING gin (first_name gin_trgm_ops);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_first_name_trgm: %', SQLERRM;
  END;

  -- 2. leads.last_name
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_last_name_trgm
      ON leads USING gin (last_name gin_trgm_ops);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_last_name_trgm: %', SQLERRM;
  END;

  -- 3. leads.phone
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_phone_trgm
      ON leads USING gin (phone gin_trgm_ops);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_phone_trgm: %', SQLERRM;
  END;

  -- 4. leads.civil_id
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_civil_id_trgm
      ON leads USING gin (civil_id gin_trgm_ops);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_civil_id_trgm: %', SQLERRM;
  END;

  -- 5. leads(updated_at DESC) — used by useDashboardStats to fetch the most
  -- recently updated leads bounded by ADMIN_DASHBOARD_MAX_LEADS.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_updated_at_desc
      ON leads (updated_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_updated_at_desc: %', SQLERRM;
  END;

  -- 6. leads(pipeline_stage) — backs the parallel count queries in
  -- useLeadStats. A plain btree is enough since equality, low cardinality.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage
      ON leads (pipeline_stage);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_pipeline_stage: %', SQLERRM;
  END;

  -- 7. Main leads list: stage/funding filters plus stable table ordering.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_stage_funding_position_created
      ON leads (pipeline_stage, funding_type, position_in_stage, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_stage_funding_position_created: %', SQLERRM;
  END;

  -- 8. Agent leads list: RLS/role filter plus stage ordering.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_assigned_stage_position_created
      ON leads (assigned_to, pipeline_stage, position_in_stage, created_at DESC);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_assigned_stage_position_created: %', SQLERRM;
  END;

  -- 9. Filter columns used directly by /api/leads.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_contact_status
      ON leads (contact_status);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_contact_status: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_source
      ON leads (source);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_source: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_school_id
      ON leads (school_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_school_id: %', SQLERRM;
  END;

  -- 10. Per-page decoration queries from the lead table.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_students_lead_id
      ON students (lead_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_students_lead_id: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_lead_status_notes
      ON payment_transactions (lead_id, status, notes);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_payment_transactions_lead_status_notes: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_lead
      ON campaign_contacts (campaign_id, lead_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_campaign_contacts_campaign_lead: %', SQLERRM;
  END;

  -- 11. Dashboard fast-count cards.
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_leads_callback_date_status_assigned
      ON leads (callback_date, contact_status, assigned_to);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_leads_callback_date_status_assigned: %', SQLERRM;
  END;

  BEGIN
    CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date_status
      ON appointments (scheduled_date, status);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skip idx_appointments_scheduled_date_status: %', SQLERRM;
  END;
END
$idx$;
