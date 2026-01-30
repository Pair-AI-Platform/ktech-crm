-- Add position_in_stage column to track lead ordering within pipeline stages
ALTER TABLE leads ADD COLUMN position_in_stage INTEGER DEFAULT 0;

CREATE INDEX idx_leads_stage_position ON leads(pipeline_stage, position_in_stage);

-- Backfill: assign positions within each stage based on created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY pipeline_stage
    ORDER BY created_at ASC
  ) AS pos
  FROM leads
)
UPDATE leads SET position_in_stage = ranked.pos
FROM ranked WHERE leads.id = ranked.id;
