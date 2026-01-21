-- Migration: Add enrollment document tracking for SF and PUC flows
-- Based on ktech_enrollment_flow.docx

-- =============================================
-- SF (Self-Funded) Document Tracking
-- Documents are optional for SF students
-- =============================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_declaration_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_passport_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_civil_id_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_payment_receipt_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_official_transcript_submitted BOOLEAN DEFAULT false; -- Required if transfer student
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_documents_verified_by UUID REFERENCES profiles(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_documents_verified_at TIMESTAMPTZ;

-- =============================================
-- PUC (Public Universities Council) Document Tracking
-- All documents are required for PUC students
-- Fee: 10 KD
-- =============================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_high_school_certificate_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_high_school_certificate_type VARCHAR(20); -- 'original' or 'true_copy'
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_civil_id_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_parent_civil_id_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_passport_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_nationality_document_submitted BOOLEAN DEFAULT false; -- Student/Parent nationality
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_payment_receipt_submitted BOOLEAN DEFAULT false; -- 10 KD fee
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_acceptance_letter_submitted BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_documents_verified_by UUID REFERENCES profiles(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_documents_verified_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS puc_fee_paid BOOLEAN DEFAULT false;

-- =============================================
-- Add SF enrolled stage if not exists
-- Status: 150 | 400 | Others
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sf_enrolled_stage') THEN
    CREATE TYPE sf_enrolled_stage AS ENUM ('150', '400', 'other');
  END IF;
END $$;

-- Add sf_enrolled_stage column if not exists
ALTER TABLE students ADD COLUMN IF NOT EXISTS sf_enrolled_stage sf_enrolled_stage;

-- =============================================
-- Enrollment Progress Tracking
-- =============================================

-- Computed column for SF document completion percentage
CREATE OR REPLACE FUNCTION calculate_sf_documents_progress(student students)
RETURNS INTEGER AS $$
DECLARE
  total_docs INTEGER := 4; -- declaration, passport, civil_id, payment_receipt
  submitted_docs INTEGER := 0;
BEGIN
  IF student.sf_declaration_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.sf_passport_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.sf_civil_id_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.sf_payment_receipt_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  -- Add transcript if transfer student
  IF student.transfer_type IS NOT NULL THEN
    total_docs := total_docs + 1;
    IF student.sf_official_transcript_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  END IF;
  RETURN (submitted_docs * 100) / total_docs;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Computed column for PUC document completion percentage
CREATE OR REPLACE FUNCTION calculate_puc_documents_progress(student students)
RETURNS INTEGER AS $$
DECLARE
  total_docs INTEGER := 7; -- All PUC documents are required
  submitted_docs INTEGER := 0;
BEGIN
  IF student.puc_high_school_certificate_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_civil_id_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_parent_civil_id_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_passport_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_nationality_document_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_payment_receipt_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  IF student.puc_acceptance_letter_submitted THEN submitted_docs := submitted_docs + 1; END IF;
  RETURN (submitted_docs * 100) / total_docs;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- Comments for documentation
-- =============================================

COMMENT ON COLUMN students.sf_declaration_submitted IS 'SF optional document: Declaration form';
COMMENT ON COLUMN students.sf_passport_submitted IS 'SF optional document: Passport copy';
COMMENT ON COLUMN students.sf_civil_id_submitted IS 'SF optional document: Civil ID copy';
COMMENT ON COLUMN students.sf_payment_receipt_submitted IS 'SF optional document: Payment receipt';
COMMENT ON COLUMN students.sf_official_transcript_submitted IS 'SF optional document: Official transcript (required if transfer student)';

COMMENT ON COLUMN students.puc_high_school_certificate_submitted IS 'PUC required document: High school certificate (original or true copy)';
COMMENT ON COLUMN students.puc_high_school_certificate_type IS 'PUC document type: original or true_copy';
COMMENT ON COLUMN students.puc_civil_id_submitted IS 'PUC required document: Student civil ID';
COMMENT ON COLUMN students.puc_parent_civil_id_submitted IS 'PUC required document: Parent civil ID';
COMMENT ON COLUMN students.puc_passport_submitted IS 'PUC required document: Passport copy';
COMMENT ON COLUMN students.puc_nationality_document_submitted IS 'PUC required document: Student/Parent nationality document';
COMMENT ON COLUMN students.puc_payment_receipt_submitted IS 'PUC required document: 10 KD fee payment receipt';
COMMENT ON COLUMN students.puc_acceptance_letter_submitted IS 'PUC required document: Acceptance letter';
COMMENT ON COLUMN students.puc_fee_paid IS 'PUC fee (10 KD) has been paid';

COMMENT ON COLUMN students.sf_enrolled_stage IS 'SF enrollment stage: 150 KWD (seat reserved), 400 KWD, or other amount';
