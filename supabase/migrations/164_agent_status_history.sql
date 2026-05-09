-- Agent status history: log every manual_status change so admins can see
-- time-on-break, time-in-meeting, and status timelines.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS agent_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('online', 'meeting', 'break')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_status_history_user ON agent_status_history(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_status_history_open ON agent_status_history(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_status_history_day ON agent_status_history(started_at DESC);

ALTER TABLE agent_status_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own history; admins can read everyone's
DROP POLICY IF EXISTS "status_history_read" ON agent_status_history;
CREATE POLICY "status_history_read" ON agent_status_history
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Users can insert rows for themselves
DROP POLICY IF EXISTS "status_history_insert_self" ON agent_status_history;
CREATE POLICY "status_history_insert_self" ON agent_status_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update (close) their own open rows
DROP POLICY IF EXISTS "status_history_update_self" ON agent_status_history;
CREATE POLICY "status_history_update_self" ON agent_status_history
  FOR UPDATE USING (auth.uid() = user_id);
