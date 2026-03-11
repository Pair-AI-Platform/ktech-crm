-- Migration: Add "Academic Reason" to lost_reasons table
INSERT INTO lost_reasons (category, reason_en, reason_ar)
VALUES ('academic', 'Academic Reason', 'سبب أكاديمي')
ON CONFLICT DO NOTHING;
