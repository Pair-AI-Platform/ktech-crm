-- PSP Documents Table
-- Stores uploaded documents for PSP (PUC Submission Pipeline) with verification workflow

CREATE TABLE IF NOT EXISTS psp_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Document identification
  document_type VARCHAR(50) NOT NULL,  -- e.g., 'passport', 'civil_id', 'hs_certificate'
  graduate_type VARCHAR(10) NOT NULL,  -- 'GOV', 'US', 'UK', 'KSA'

  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),              -- MIME type
  file_size INTEGER,                   -- Size in bytes
  storage_path TEXT NOT NULL,          -- Supabase storage path
  public_url TEXT,                     -- Public URL for the file

  -- Verification workflow
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- Document validity tracking
  expiration_date DATE,                -- For passports, civil IDs
  is_expired BOOLEAN DEFAULT FALSE,    -- Updated by application based on expiration_date

  -- Audit fields
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique document per lead/type/graduate_type combination
  CONSTRAINT unique_lead_doc UNIQUE(lead_id, document_type, graduate_type)
);

-- Indexes for common queries
CREATE INDEX idx_psp_documents_lead_id ON psp_documents(lead_id);
CREATE INDEX idx_psp_documents_graduate_type ON psp_documents(graduate_type);
CREATE INDEX idx_psp_documents_is_verified ON psp_documents(is_verified);
CREATE INDEX idx_psp_documents_expiration ON psp_documents(expiration_date) WHERE expiration_date IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_psp_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER psp_documents_updated_at
  BEFORE UPDATE ON psp_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_psp_documents_updated_at();

-- RLS Policies
ALTER TABLE psp_documents ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view documents
CREATE POLICY "Users can view psp documents"
  ON psp_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert documents
CREATE POLICY "Users can insert psp documents"
  ON psp_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update documents
CREATE POLICY "Users can update psp documents"
  ON psp_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete documents
CREATE POLICY "Users can delete psp documents"
  ON psp_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Comments for documentation
COMMENT ON TABLE psp_documents IS 'Stores PSP submission documents with verification workflow';
COMMENT ON COLUMN psp_documents.document_type IS 'Type of document: passport, civil_id, parent_civil_id, hs_certificate, nationality, puc_receipt, acceptance_letter, transcript_moh, sequence_letter, gcse, a_level, equivalency, photo, shahada';
COMMENT ON COLUMN psp_documents.graduate_type IS 'Graduate type: GOV, US, UK, KSA';
COMMENT ON COLUMN psp_documents.is_verified IS 'Whether the document has been verified by an admin';
COMMENT ON COLUMN psp_documents.expiration_date IS 'Expiration date for documents like passports and civil IDs';
COMMENT ON COLUMN psp_documents.is_expired IS 'True if document has expired based on expiration_date';
