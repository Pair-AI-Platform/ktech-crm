-- =============================================
-- FIX soft_delete_lead — remove reference to dropped leads.status column
-- =============================================
-- The original soft_delete_lead() (migration 022) copied lead_record.status
-- into deleted_leads.status. The leads.status column has since been removed
-- (replaced by pipeline_stage / contact_status), so every call now fails with:
--   record "lead_record" has no field "status"
-- This recreates the function identically except the deleted_leads.status
-- column is populated from contact_status (cast to text) instead of the
-- non-existent status column.

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
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

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
    lead_record.contact_status::text, lead_record.pipeline_stage, lead_record.contact_status,
    lead_record.lost_reason_id, lead_record.lost_reason_notes,
    lead_record.assigned_to, lead_record.assigned_at, lead_record.assigned_by,
    lead_record.created_at, lead_record.updated_at,
    lead_record.first_contacted_at, lead_record.last_contacted_at,
    lead_record.notes,
    deleting_user_id, reason
  )
  RETURNING id INTO deleted_record_id;

  DELETE FROM leads WHERE id = lead_id;

  RETURN deleted_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
