-- Migration 067: Add SF document tracking columns to leads table
-- These were previously only on students table (migration 026)
-- The lead table UI needs them for document completion indicator

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_declaration_submitted BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_passport_submitted BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_civil_id_submitted BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_payment_receipt_submitted BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_official_transcript_submitted BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_documents_verified_by UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sf_documents_verified_at TIMESTAMPTZ;
