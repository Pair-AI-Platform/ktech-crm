-- Remove "Expo" lead source (keep "Exhibitions" only)
-- Reassign any leads currently using "expo" to "exhibitions"
UPDATE leads SET source = 'exhibitions' WHERE source = 'expo';
DELETE FROM lead_sources WHERE value = 'expo';
