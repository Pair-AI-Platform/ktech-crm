-- Migration: Add new competitors to lost reasons
INSERT INTO lost_reasons (category, reason_en, reason_ar) VALUES
  ('competitors', 'AU', 'AU'),
  ('competitors', 'KCST', 'KCST'),
  ('competitors', 'AIU', 'AIU'),
  ('competitors', 'CCK', 'CCK'),
  ('competitors', 'Boxhill', 'Boxhill'),
  ('competitors', 'CAT', 'CAT')
ON CONFLICT DO NOTHING;
