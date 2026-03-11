-- Migration: Add "PUC Rejected" lost reason for leads not accepted by ministry
INSERT INTO lost_reasons (category, reason_en, reason_ar, is_active) VALUES
  ('academic', 'PUC Rejected', 'مرفوض من التطبيقي', true)
ON CONFLICT DO NOTHING;
