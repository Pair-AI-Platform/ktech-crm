-- Store the uploaded Withdrawal Form (PDF or image) on the lead record so it is
-- visible to every user on every device. Required when a lead is Ministry Blocked.
-- Holds file metadata: { name, type, size, url, storage_path, uploaded_at }.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS withdrawal_form JSONB;

COMMENT ON COLUMN leads.withdrawal_form IS
  'Uploaded Withdrawal Form metadata { name, type, size, url, storage_path, uploaded_at }. Required when ministry_blocked is TRUE. File lives in the documents storage bucket under leads/<id>/withdrawal-form/.';
