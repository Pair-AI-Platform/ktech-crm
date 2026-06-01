-- Store the uploaded IELTS/TOEFL certificate (PDF or image) on the lead record
-- so it is visible to every user on every device, instead of browser localStorage.
-- Holds file metadata: { name, type, size, url, storage_path, uploaded_at }.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ielts_toefl_certificate JSONB;

COMMENT ON COLUMN leads.ielts_toefl_certificate IS
  'Uploaded IELTS/TOEFL certificate metadata { name, type, size, url, storage_path, uploaded_at }. File lives in the documents storage bucket under leads/<id>/ielts-toefl/.';
