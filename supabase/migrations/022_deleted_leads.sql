-- =============================================
-- DELETED LEADS TABLE - Soft Delete Storage
-- =============================================

-- Create deleted_leads table to store leads that were deleted by agents
-- Admins can view and restore these leads
CREATE TABLE deleted_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Original lead ID (for reference)
  original_lead_id UUID NOT NULL,

  -- Personal Information (copied from leads table)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  first_name_ar VARCHAR(100),
  last_name_ar VARCHAR(100),
  civil_id VARCHAR(12),
  phone VARCHAR(8) NOT NULL,
  phone_secondary VARCHAR(8),
  email VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  nationality VARCHAR(100) DEFAULT 'Kuwaiti',
  is_kuwaiti BOOLEAN DEFAULT true,
  is_transfer_student BOOLEAN DEFAULT false,
  is_special_needs BOOLEAN DEFAULT false,
  is_diplomatic BOOLEAN DEFAULT false,

  -- Academic Information
  school_id UUID REFERENCES schools(id),
  school_name_custom VARCHAR(255),
  governorate governorate,
  grade_level grade_level,
  academic_track academic_track,
  gpa_grade_10 DECIMAL(5,2),
  gpa_grade_11 DECIMAL(5,2),
  gpa_grade_12_expected DECIMAL(5,2),
  intended_major intended_major,
  custom_major VARCHAR(255),
  graduation_year INTEGER,

  -- Placement Test
  placement_level placement_level,
  placement_english_score DECIMAL(5,2),
  placement_english_passed BOOLEAN,
  placement_english_override BOOLEAN,
  placement_math_score DECIMAL(5,2),
  placement_math_passed BOOLEAN,
  placement_math_override BOOLEAN,
  placement_computer_score DECIMAL(5,2),
  placement_computer_passed BOOLEAN,
  placement_computer_override BOOLEAN,
  has_ielts_toefl BOOLEAN,
  placement_lms_synced BOOLEAN,

  -- Financial Qualification
  funding_type funding_type DEFAULT 'self_funded',
  has_weyay_account BOOLEAN DEFAULT false,
  has_bank_account BOOLEAN DEFAULT false,

  -- Lead Tracking
  source_category lead_source_category,
  source lead_source,
  source_detail VARCHAR(255),
  referral_code VARCHAR(50),
  referred_by_lead_id UUID,

  -- Pipeline (at time of deletion)
  status VARCHAR(50),
  pipeline_stage pipeline_stage,
  completed_stages TEXT[],
  contact_status contact_status,
  lost_reason_id UUID REFERENCES lost_reasons(id),
  lost_reason_notes TEXT,

  -- Assignment (at time of deletion)
  assigned_to UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES profiles(id),

  -- Original Timestamps
  original_created_at TIMESTAMPTZ,
  original_updated_at TIMESTAMPTZ,
  first_contacted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Deletion metadata
  deleted_by UUID NOT NULL REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deletion_reason TEXT,

  -- Restoration tracking
  restored_by UUID REFERENCES profiles(id),
  restored_at TIMESTAMPTZ,
  is_restored BOOLEAN DEFAULT false
);

-- Indexes for efficient querying
CREATE INDEX idx_deleted_leads_deleted_at ON deleted_leads(deleted_at DESC);
CREATE INDEX idx_deleted_leads_deleted_by ON deleted_leads(deleted_by);
CREATE INDEX idx_deleted_leads_phone ON deleted_leads(phone);
CREATE INDEX idx_deleted_leads_civil_id ON deleted_leads(civil_id);
CREATE INDEX idx_deleted_leads_is_restored ON deleted_leads(is_restored);
CREATE INDEX idx_deleted_leads_original_lead_id ON deleted_leads(original_lead_id);

-- Enable RLS
ALTER TABLE deleted_leads ENABLE ROW LEVEL SECURITY;

-- Only admins can view deleted leads
CREATE POLICY deleted_leads_select_policy ON deleted_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can insert (when soft deleting)
-- Note: The actual insert happens via service role or function
CREATE POLICY deleted_leads_insert_policy ON deleted_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update (for restoration)
CREATE POLICY deleted_leads_update_policy ON deleted_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to move a lead to deleted_leads table
CREATE OR REPLACE FUNCTION soft_delete_lead(
  lead_id UUID,
  deleting_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  deleted_record_id UUID;
  lead_record RECORD;
BEGIN
  -- Get the lead data
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Insert into deleted_leads
  INSERT INTO deleted_leads (
    original_lead_id,
    first_name, last_name, first_name_ar, last_name_ar,
    civil_id, phone, phone_secondary, email,
    date_of_birth, gender, nationality, is_kuwaiti,
    is_transfer_student, is_special_needs, is_diplomatic,
    school_id, school_name_custom, governorate,
    grade_level, academic_track,
    gpa_grade_10, gpa_grade_11, gpa_grade_12_expected,
    intended_major, custom_major, graduation_year,
    placement_level,
    placement_english_score, placement_english_passed, placement_english_override,
    placement_math_score, placement_math_passed, placement_math_override,
    placement_computer_score, placement_computer_passed, placement_computer_override,
    has_ielts_toefl, placement_lms_synced,
    funding_type, has_weyay_account, has_bank_account,
    source_category, source, source_detail, referral_code, referred_by_lead_id,
    status, pipeline_stage, contact_status,
    lost_reason_id, lost_reason_notes,
    assigned_to, assigned_at, assigned_by,
    original_created_at, original_updated_at,
    first_contacted_at, last_contacted_at,
    notes,
    deleted_by, deletion_reason
  )
  VALUES (
    lead_record.id,
    lead_record.first_name, lead_record.last_name, lead_record.first_name_ar, lead_record.last_name_ar,
    lead_record.civil_id, lead_record.phone, lead_record.phone_secondary, lead_record.email,
    lead_record.date_of_birth, lead_record.gender, lead_record.nationality, lead_record.is_kuwaiti,
    lead_record.is_transfer_student, lead_record.is_special_needs, lead_record.is_diplomatic,
    lead_record.school_id, lead_record.school_name_custom, lead_record.governorate,
    lead_record.grade_level, lead_record.academic_track,
    lead_record.gpa_grade_10, lead_record.gpa_grade_11, lead_record.gpa_grade_12_expected,
    lead_record.intended_major, lead_record.custom_major, lead_record.graduation_year,
    lead_record.placement_level,
    lead_record.placement_english_score, lead_record.placement_english_passed, lead_record.placement_english_override,
    lead_record.placement_math_score, lead_record.placement_math_passed, lead_record.placement_math_override,
    lead_record.placement_computer_score, lead_record.placement_computer_passed, lead_record.placement_computer_override,
    lead_record.has_ielts_toefl, lead_record.placement_lms_synced,
    lead_record.funding_type, lead_record.has_weyay_account, lead_record.has_bank_account,
    lead_record.source_category, lead_record.source, lead_record.source_detail, lead_record.referral_code, lead_record.referred_by_lead_id,
    lead_record.status, lead_record.pipeline_stage, lead_record.contact_status,
    lead_record.lost_reason_id, lead_record.lost_reason_notes,
    lead_record.assigned_to, lead_record.assigned_at, lead_record.assigned_by,
    lead_record.created_at, lead_record.updated_at,
    lead_record.first_contacted_at, lead_record.last_contacted_at,
    lead_record.notes,
    deleting_user_id, reason
  )
  RETURNING id INTO deleted_record_id;

  -- Delete the original lead
  DELETE FROM leads WHERE id = lead_id;

  RETURN deleted_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a deleted lead (admin only)
CREATE OR REPLACE FUNCTION restore_deleted_lead(
  deleted_lead_id UUID,
  restoring_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_lead_id UUID;
  deleted_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = restoring_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can restore deleted leads';
  END IF;

  -- Get the deleted lead data
  SELECT * INTO deleted_record FROM deleted_leads WHERE id = deleted_lead_id AND is_restored = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deleted lead not found or already restored';
  END IF;

  -- Insert back into leads table
  INSERT INTO leads (
    first_name, last_name, first_name_ar, last_name_ar,
    civil_id, phone, phone_secondary, email,
    date_of_birth, gender, nationality, is_kuwaiti,
    is_transfer_student, is_special_needs, is_diplomatic,
    school_id, school_name_custom, governorate,
    grade_level, academic_track,
    gpa_grade_10, gpa_grade_11, gpa_grade_12_expected,
    intended_major, custom_major, graduation_year,
    placement_level,
    placement_english_score, placement_english_passed, placement_english_override,
    placement_math_score, placement_math_passed, placement_math_override,
    placement_computer_score, placement_computer_passed, placement_computer_override,
    has_ielts_toefl, placement_lms_synced,
    funding_type, has_weyay_account, has_bank_account,
    source_category, source, source_detail, referral_code, referred_by_lead_id,
    status, pipeline_stage, contact_status,
    lost_reason_id, lost_reason_notes,
    assigned_to, assigned_at, assigned_by,
    first_contacted_at, last_contacted_at,
    notes
  )
  VALUES (
    deleted_record.first_name, deleted_record.last_name, deleted_record.first_name_ar, deleted_record.last_name_ar,
    deleted_record.civil_id, deleted_record.phone, deleted_record.phone_secondary, deleted_record.email,
    deleted_record.date_of_birth, deleted_record.gender, deleted_record.nationality, deleted_record.is_kuwaiti,
    deleted_record.is_transfer_student, deleted_record.is_special_needs, deleted_record.is_diplomatic,
    deleted_record.school_id, deleted_record.school_name_custom, deleted_record.governorate,
    deleted_record.grade_level, deleted_record.academic_track,
    deleted_record.gpa_grade_10, deleted_record.gpa_grade_11, deleted_record.gpa_grade_12_expected,
    deleted_record.intended_major, deleted_record.custom_major, deleted_record.graduation_year,
    deleted_record.placement_level,
    deleted_record.placement_english_score, deleted_record.placement_english_passed, deleted_record.placement_english_override,
    deleted_record.placement_math_score, deleted_record.placement_math_passed, deleted_record.placement_math_override,
    deleted_record.placement_computer_score, deleted_record.placement_computer_passed, deleted_record.placement_computer_override,
    deleted_record.has_ielts_toefl, deleted_record.placement_lms_synced,
    deleted_record.funding_type, deleted_record.has_weyay_account, deleted_record.has_bank_account,
    deleted_record.source_category, deleted_record.source, deleted_record.source_detail, deleted_record.referral_code, deleted_record.referred_by_lead_id,
    deleted_record.status, deleted_record.pipeline_stage, deleted_record.contact_status,
    deleted_record.lost_reason_id, deleted_record.lost_reason_notes,
    deleted_record.assigned_to, deleted_record.assigned_at, deleted_record.assigned_by,
    deleted_record.first_contacted_at, deleted_record.last_contacted_at,
    deleted_record.notes
  )
  RETURNING id INTO new_lead_id;

  -- Mark the deleted record as restored
  UPDATE deleted_leads
  SET
    is_restored = true,
    restored_by = restoring_user_id,
    restored_at = NOW()
  WHERE id = deleted_lead_id;

  RETURN new_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION soft_delete_lead(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_deleted_lead(UUID, UUID) TO authenticated;
