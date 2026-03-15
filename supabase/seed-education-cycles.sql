-- Seed: Education Cycles with realistic academic year data
-- Creates 4 cycles: 2023-2024 (archived), 2024-2025 (archived), 2025-2026 (active), 2026-2027 (upcoming)

BEGIN;

-- Clean up existing cycles and their terms (if any)
DELETE FROM semesters WHERE cycle_id IN (SELECT id FROM education_cycles);
DELETE FROM education_cycles;

-- ============================================================
-- 1. Create Education Cycles
-- ============================================================

-- Past cycle: 2023-2024
INSERT INTO education_cycles (id, name, start_year, end_year, is_active)
VALUES ('a1000000-0000-0000-0000-000000000001', '2023-2024', 2023, 2024, false);

-- Past cycle: 2024-2025
INSERT INTO education_cycles (id, name, start_year, end_year, is_active)
VALUES ('a1000000-0000-0000-0000-000000000002', '2024-2025', 2024, 2025, false);

-- Active cycle: 2025-2026
INSERT INTO education_cycles (id, name, start_year, end_year, is_active)
VALUES ('a1000000-0000-0000-0000-000000000003', '2025-2026', 2025, 2026, true);

-- Upcoming cycle: 2026-2027
INSERT INTO education_cycles (id, name, start_year, end_year, is_active)
VALUES ('a1000000-0000-0000-0000-000000000004', '2026-2027', 2026, 2027, false);

-- ============================================================
-- 2. Create Terms (Semesters) for each cycle
-- ============================================================

-- 2023-2024 terms (both closed)
INSERT INTO semesters (id, name, start_date, end_date, is_active, is_open, cycle_id, term_type)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Fall 2023', '2023-09-01', '2024-01-31', false, false, 'a1000000-0000-0000-0000-000000000001', 'fall'),
  ('b1000000-0000-0000-0000-000000000002', 'Spring 2024', '2024-02-01', '2024-06-30', false, false, 'a1000000-0000-0000-0000-000000000001', 'spring');

-- 2024-2025 terms (both closed)
INSERT INTO semesters (id, name, start_date, end_date, is_active, is_open, cycle_id, term_type)
VALUES
  ('b1000000-0000-0000-0000-000000000003', 'Fall 2024', '2024-09-01', '2025-01-31', false, false, 'a1000000-0000-0000-0000-000000000002', 'fall'),
  ('b1000000-0000-0000-0000-000000000004', 'Spring 2025', '2025-02-01', '2025-06-30', false, false, 'a1000000-0000-0000-0000-000000000002', 'spring');

-- 2025-2026 terms (active cycle — spring open, fall closed since it's past)
INSERT INTO semesters (id, name, start_date, end_date, is_active, is_open, cycle_id, term_type)
VALUES
  ('b1000000-0000-0000-0000-000000000005', 'Fall 2025', '2025-09-01', '2026-01-31', true, false, 'a1000000-0000-0000-0000-000000000003', 'fall'),
  ('b1000000-0000-0000-0000-000000000006', 'Spring 2026', '2026-02-01', '2026-06-30', true, true, 'a1000000-0000-0000-0000-000000000003', 'spring');

-- 2026-2027 terms (upcoming, both closed)
INSERT INTO semesters (id, name, start_date, end_date, is_active, is_open, cycle_id, term_type)
VALUES
  ('b1000000-0000-0000-0000-000000000007', 'Fall 2026', '2026-09-01', '2027-01-31', false, false, 'a1000000-0000-0000-0000-000000000004', 'fall'),
  ('b1000000-0000-0000-0000-000000000008', 'Spring 2027', '2027-02-01', '2027-06-30', false, false, 'a1000000-0000-0000-0000-000000000004', 'spring');

COMMIT;
