-- Add 'whatsapp_ai' to lead_source enum
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'whatsapp_ai';

-- Round-robin state table (singleton row)
CREATE TABLE IF NOT EXISTS round_robin_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_agent_index integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the singleton row
INSERT INTO round_robin_state (id, last_agent_index)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- RPC: assign_round_robin
-- Returns the next active agent via round-robin with row-level locking
CREATE OR REPLACE FUNCTION assign_round_robin()
RETURNS TABLE (agent_id uuid, agent_name text, agent_email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agents uuid[];
  agent_names text[];
  agent_emails text[];
  total integer;
  current_index integer;
  next_index integer;
BEGIN
  -- Get active agents ordered deterministically
  SELECT
    array_agg(p.id ORDER BY p.created_at),
    array_agg(p.full_name ORDER BY p.created_at),
    array_agg(p.email ORDER BY p.created_at)
  INTO agents, agent_names, agent_emails
  FROM profiles p
  WHERE p.is_active = true
    AND p.role = 'agent';

  total := coalesce(array_length(agents, 1), 0);

  IF total = 0 THEN
    RAISE EXCEPTION 'No active agents available for round-robin assignment';
  END IF;

  -- Lock + read current index
  SELECT rrs.last_agent_index INTO current_index
  FROM round_robin_state rrs
  WHERE rrs.id = 1
  FOR UPDATE;

  -- Compute next index with modulo wrap
  next_index := current_index % total + 1;

  -- Update state
  UPDATE round_robin_state
  SET last_agent_index = next_index,
      updated_at = now()
  WHERE id = 1;

  -- Return the selected agent (arrays are 1-indexed in PG)
  agent_id := agents[next_index];
  agent_name := agent_names[next_index];
  agent_email := agent_emails[next_index];
  RETURN NEXT;
END;
$$;
