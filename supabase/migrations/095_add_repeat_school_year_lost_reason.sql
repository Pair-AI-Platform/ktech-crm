-- Add "Repeat School Year" lost reason under academic category
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active)
VALUES ('academic', 'Repeat School Year', 'إعادة سنة دراسية', true)
ON CONFLICT DO NOTHING;
