-- Migration 114: Seed historical semesters (Kuwait academic calendar)
-- 3 years back: Fall/Spring/Summer cycles

BEGIN;

-- 1. Deactivate all currently active semesters
UPDATE semesters SET is_active = false WHERE is_active = true;

-- 2. Delete seed semesters with wrong date ranges (from initial setup)
--    Save orphaned lead semester_ids for reassignment
CREATE TEMP TABLE orphaned_leads AS
  SELECT l.id AS lead_id, l.semester_id, l.created_at
  FROM leads l
  JOIN semesters s ON s.id = l.semester_id
  WHERE s.name IN ('Fall 2024', 'Spring 2025')
    AND (
      -- Wrong date ranges (not matching our canonical dates)
      (s.name = 'Fall 2024' AND (s.start_date != '2024-09-01' OR s.end_date != '2025-01-31'))
      OR (s.name = 'Spring 2025' AND (s.start_date != '2025-02-01' OR s.end_date != '2025-06-30'))
    );

DELETE FROM semesters
WHERE name IN ('Fall 2024', 'Spring 2025')
  AND (
    (name = 'Fall 2024' AND (start_date != '2024-09-01' OR end_date != '2025-01-31'))
    OR (name = 'Spring 2025' AND (start_date != '2025-02-01' OR end_date != '2025-06-30'))
  );

-- 3. Insert all 11 semesters (skip if name already exists)
INSERT INTO semesters (name, start_date, end_date, is_active) VALUES
  ('Fall 2022',   '2022-09-01', '2023-01-31', false),
  ('Spring 2023', '2023-02-01', '2023-06-30', false),
  ('Summer 2023', '2023-07-01', '2023-08-31', false),
  ('Fall 2023',   '2023-09-01', '2024-01-31', false),
  ('Spring 2024', '2024-02-01', '2024-06-30', false),
  ('Summer 2024', '2024-07-01', '2024-08-31', false),
  ('Fall 2024',   '2024-09-01', '2025-01-31', false),
  ('Spring 2025', '2025-02-01', '2025-06-30', false),
  ('Summer 2025', '2025-07-01', '2025-08-31', false),
  ('Fall 2025',   '2025-09-01', '2026-01-31', false),
  ('Spring 2026', '2026-02-01', '2026-06-30', true)
ON CONFLICT DO NOTHING;

-- 4. Re-assign orphaned leads to the closest matching semester by created_at date
UPDATE leads l
SET semester_id = (
  SELECT s.id FROM semesters s
  WHERE l.created_at::date BETWEEN s.start_date AND s.end_date
  ORDER BY s.start_date DESC
  LIMIT 1
)
FROM orphaned_leads o
WHERE l.id = o.lead_id
  AND l.semester_id IS NULL;

-- If any leads still orphaned (created_at outside all semester ranges), assign to Spring 2026
UPDATE leads l
SET semester_id = (SELECT id FROM semesters WHERE name = 'Spring 2026')
FROM orphaned_leads o
WHERE l.id = o.lead_id
  AND l.semester_id IS NULL;

DROP TABLE IF EXISTS orphaned_leads;

COMMIT;
