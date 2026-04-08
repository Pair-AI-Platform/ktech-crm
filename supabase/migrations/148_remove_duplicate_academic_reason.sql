-- Remove duplicate "Academic Reason" from lost_reasons table
-- Keep the oldest row (lowest created_at) and delete the rest
DELETE FROM lost_reasons
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY category, reason_en ORDER BY created_at ASC) AS rn
    FROM lost_reasons
    WHERE category = 'academic' AND reason_en = 'Academic Reason'
  ) dupes
  WHERE rn > 1
);
