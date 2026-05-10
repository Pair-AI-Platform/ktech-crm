-- Migration 172: Allow PUC bulk import to enroll leads from any stage
--
-- Adds opt-in `p_skip_stage_check` parameter to `convert_lead_to_student`.
-- Default (FALSE) preserves the existing stage-check guard that the cash and
-- MyFatoorah webhook payment flows rely on. Only the PUC bulk import route
-- passes TRUE, which lets the ministry acceptance list override any prior
-- stage (lost/withdraw/etc.) when matching a lead by Civil ID or Name+School.
--
-- Also captures the actual current stage in the stage_change audit log so the
-- transition is recorded accurately (e.g. "Lost → Enrolled") instead of the
-- previously-hardcoded "Application → Enrolled".

DROP FUNCTION IF EXISTS convert_lead_to_student(UUID, UUID, NUMERIC, UUID);

CREATE OR REPLACE FUNCTION convert_lead_to_student(
  p_lead_id UUID,
  p_transaction_id UUID,
  p_amount_paid NUMERIC,
  p_user_id UUID DEFAULT NULL,
  p_skip_stage_check BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_existing_student UUID;
  v_student_id UUID;
  v_completed_stages TEXT[];
  v_old_stage TEXT;
  v_old_stage_label TEXT;
  v_result JSONB;
BEGIN
  -- 1. Fetch the lead (lock row to prevent concurrent conversion)
  SELECT * INTO v_lead
  FROM leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found');
  END IF;

  -- 2. Check lead is in correct stage (unless caller opted out)
  IF NOT p_skip_stage_check AND v_lead.pipeline_stage != 'application' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Lead must be in ''application'' stage to enroll. Current stage: %s', v_lead.pipeline_stage)
    );
  END IF;

  -- 3. Check no existing student
  SELECT id INTO v_existing_student
  FROM students
  WHERE lead_id = p_lead_id;

  IF v_existing_student IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A student record already exists for this lead');
  END IF;

  -- Capture actual prior stage for activity log
  v_old_stage := v_lead.pipeline_stage;
  v_old_stage_label := CASE v_old_stage
    WHEN 'new' THEN 'New'
    WHEN 'contacted' THEN 'Contacted'
    WHEN 'visit' THEN 'Visit'
    WHEN 'test' THEN 'Test'
    WHEN 'application' THEN 'Application'
    WHEN 'puc_document_submission' THEN 'Document Submission'
    WHEN 'puc_application_submission' THEN 'Application Submission'
    WHEN 'applicant' THEN 'Applicant'
    WHEN 'enrolled' THEN 'Enrolled'
    WHEN 'lost' THEN 'Lost'
    WHEN 'withdraw' THEN 'Withdraw'
    ELSE INITCAP(REPLACE(v_old_stage, '_', ' '))
  END;

  -- 4. Create student record
  INSERT INTO students (
    lead_id, first_name, last_name, civil_id, phone, email,
    funding_type, amount_paid, assigned_to, enrolled_at,
    placement_level, placement_test_passed
  ) VALUES (
    v_lead.id, v_lead.first_name, v_lead.last_name, v_lead.civil_id,
    v_lead.phone, v_lead.email,
    COALESCE(v_lead.funding_type, 'self_funded'),
    p_amount_paid, v_lead.assigned_to, NOW(),
    v_lead.placement_level,
    (COALESCE(v_lead.placement_english_passed, false) AND
     COALESCE(v_lead.placement_math_passed, false) AND
     COALESCE(v_lead.placement_computer_passed, false))
  )
  RETURNING id INTO v_student_id;

  -- 5. Update lead to enrolled stage
  v_completed_stages := COALESCE(v_lead.completed_stages, ARRAY[]::TEXT[]) || ARRAY['enrolled'];

  UPDATE leads
  SET pipeline_stage = 'enrolled',
      completed_stages = v_completed_stages,
      last_contacted_at = NOW()
  WHERE id = p_lead_id;

  -- 6. Update payment transaction
  UPDATE payment_transactions
  SET student_id = v_student_id,
      status = 'completed',
      completed_at = NOW(),
      processed_by = p_user_id
  WHERE id = p_transaction_id;

  -- 7. Log enrollment activity
  INSERT INTO activities (lead_id, student_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, v_student_id, 'enrollment_completed', 'Enrolled',
    format('%s %s enrolled after paying %s KWD', v_lead.first_name, v_lead.last_name, p_amount_paid),
    jsonb_build_object(
      'transaction_id', p_transaction_id,
      'amount_paid', p_amount_paid,
      'funding_type', v_lead.funding_type,
      'old_stage', v_old_stage
    ),
    p_user_id
  );

  -- 8. Log stage change activity using the actual prior stage
  INSERT INTO activities (lead_id, student_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, v_student_id, 'stage_change', 'Stage Changed',
    format('%s %s: %s → Enrolled', v_lead.first_name, v_lead.last_name, v_old_stage_label),
    jsonb_build_object(
      'old_stage', v_old_stage,
      'new_stage', 'enrolled',
      'old_stage_label', v_old_stage_label,
      'new_stage_label', 'Enrolled'
    ),
    p_user_id
  );

  -- Return success with student data
  SELECT jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'student', row_to_json(s)::jsonb
  ) INTO v_result
  FROM students s WHERE s.id = v_student_id;

  RETURN v_result;
END;
$$;
