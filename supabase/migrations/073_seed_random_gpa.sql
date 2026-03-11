-- Seed random GPA values for all leads that currently have none
-- expected_gpa: realistic range 60-95 (rounded to 1 decimal)
-- actual_gpa:   slightly lower on average, range 55-90 (rounded to 1 decimal)

UPDATE leads
SET
  expected_gpa = ROUND((60 + random() * 35)::numeric, 1),
  actual_gpa   = ROUND((55 + random() * 35)::numeric, 1)
WHERE expected_gpa IS NULL
  AND actual_gpa IS NULL;
