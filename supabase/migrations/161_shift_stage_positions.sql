-- RPC to shift all lead positions in a stage down by 1,
-- so a newly moved lead can be placed at position 0 (top of list)
CREATE OR REPLACE FUNCTION shift_stage_positions(target_stage text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE leads
  SET position_in_stage = COALESCE(position_in_stage, 0) + 1
  WHERE pipeline_stage = target_stage::pipeline_stage;
$$;