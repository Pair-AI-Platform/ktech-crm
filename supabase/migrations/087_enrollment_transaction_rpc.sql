-- Migration 087: Atomic enrollment conversion via PostgreSQL function
-- Ensures student creation + lead update + transaction update are atomic

CREATE OR REPLACE FUNCTION convert_lead_to_student(
  p_lead_id UUID,
  p_transaction_id UUID,
  p_amount_paid NUMERIC,
  p_user_id UUID DEFAULT NULL
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

  -- 2. Check lead is in correct stage
  IF v_lead.pipeline_stage != 'application' THEN
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

  -- 7. Log enrollment activity (non-critical, but inside transaction)
  INSERT INTO activities (lead_id, student_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, v_student_id, 'enrollment_completed', 'Enrolled',
    format('%s %s enrolled after paying %s KWD', v_lead.first_name, v_lead.last_name, p_amount_paid),
    jsonb_build_object('transaction_id', p_transaction_id, 'amount_paid', p_amount_paid, 'funding_type', v_lead.funding_type),
    p_user_id
  );

  -- 8. Log stage change activity
  INSERT INTO activities (lead_id, student_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, v_student_id, 'stage_change', 'Stage Changed',
    format('%s %s: Application → Enrolled', v_lead.first_name, v_lead.last_name),
    jsonb_build_object('old_stage', 'application', 'new_stage', 'enrolled', 'old_stage_label', 'Application', 'new_stage_label', 'Enrolled'),
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

-- SF lead promotion (application → applicant)
CREATE OR REPLACE FUNCTION promote_sf_lead_to_applicant(
  p_lead_id UUID,
  p_transaction_id UUID,
  p_amount_paid NUMERIC,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_completed_stages TEXT[];
BEGIN
  -- Lock and fetch lead
  SELECT * INTO v_lead
  FROM leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead not found');
  END IF;

  IF v_lead.funding_type != 'self_funded' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead is not self-funded');
  END IF;

  IF v_lead.pipeline_stage != 'application' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Lead must be in ''application'' stage. Current stage: %s', v_lead.pipeline_stage)
    );
  END IF;

  -- Update lead stage
  v_completed_stages := COALESCE(v_lead.completed_stages, ARRAY[]::TEXT[]) || ARRAY['applicant'];

  UPDATE leads
  SET pipeline_stage = 'applicant',
      completed_stages = v_completed_stages,
      last_contacted_at = NOW()
  WHERE id = p_lead_id;

  -- Update payment transaction
  UPDATE payment_transactions
  SET status = 'completed',
      completed_at = NOW(),
      processed_by = p_user_id
  WHERE id = p_transaction_id;

  -- Log payment activity
  INSERT INTO activities (lead_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, 'payment_received', 'Payment Received (SF)',
    format('%s %s paid %s KWD — moved to Applicant', v_lead.first_name, v_lead.last_name, p_amount_paid),
    jsonb_build_object('transaction_id', p_transaction_id, 'amount_paid', p_amount_paid, 'funding_type', 'self_funded'),
    p_user_id
  );

  -- Log stage change
  INSERT INTO activities (lead_id, activity_type, title, description, metadata, created_by)
  VALUES (
    p_lead_id, 'stage_change', 'Stage Changed',
    format('%s %s: Application → Applicant (SF payment)', v_lead.first_name, v_lead.last_name),
    jsonb_build_object('old_stage', 'application', 'new_stage', 'applicant', 'old_stage_label', 'Application', 'new_stage_label', 'Applicant', 'reason', 'sf_payment'),
    p_user_id
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
