-- Add puc_document_status_override column to leads table
-- Allows users to manually override the auto-computed document status
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS puc_document_status_override TEXT DEFAULT NULL;
