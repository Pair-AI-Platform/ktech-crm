-- Migration 059: PUC SRJ Amendments
-- Renames document types and adds index for performance

-- Rename sequence_letter -> sequence (Amendment 9)
UPDATE psp_documents SET document_type = 'sequence' WHERE document_type = 'sequence_letter';

-- Rename psp_payment_receipt -> puc_receipt (Amendment 5)
UPDATE psp_documents SET document_type = 'puc_receipt' WHERE document_type = 'psp_payment_receipt';

-- Performance index for document lookups
CREATE INDEX IF NOT EXISTS idx_psp_documents_lead_type ON psp_documents(lead_id, document_type);
