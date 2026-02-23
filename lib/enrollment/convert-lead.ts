// Lead to Student Conversion Utility
// Used when a lead completes enrollment payment

import { SupabaseClient } from '@supabase/supabase-js'
import type { Student, PipelineStage } from '@/types'

export interface ConversionResult {
  success: boolean
  student?: Student
  error?: string
}

export interface ConversionParams {
  leadId: string
  transactionId: string
  amountPaid: number
  userId?: string // The user performing the conversion
}

// Convert a lead to a student after payment
export async function convertLeadToStudent(
  supabase: SupabaseClient,
  params: ConversionParams
): Promise<ConversionResult> {
  const { leadId, transactionId, amountPaid, userId } = params

  try {
    // 1. Fetch the lead with all details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return {
        success: false,
        error: leadError?.message || 'Lead not found'
      }
    }

    // 2. Check if lead is in the correct stage
    if (lead.pipeline_stage !== 'application') {
      return {
        success: false,
        error: `Lead must be in 'application' stage to enroll. Current stage: ${lead.pipeline_stage}`
      }
    }

    // 3. Check if a student already exists for this lead
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('lead_id', leadId)
      .single()

    if (existingStudent) {
      return {
        success: false,
        error: 'A student record already exists for this lead'
      }
    }

    // 4. Create the student record
    const studentData = {
      lead_id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      civil_id: lead.civil_id,
      phone: lead.phone,
      email: lead.email,
      funding_type: lead.funding_type || 'self_funded',
      amount_paid: amountPaid,
      assigned_to: lead.assigned_to,
      enrolled_at: new Date().toISOString(),
      // Copy placement test data if available
      placement_level: lead.placement_level,
      placement_test_passed: !!(
        lead.placement_english_passed &&
        lead.placement_math_passed &&
        lead.placement_computer_passed
      ),
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single()

    if (studentError) {
      console.error('[Enrollment] Failed to create student:', studentError)
      return {
        success: false,
        error: `Failed to create student: ${studentError.message}`
      }
    }

    // 5. Update the lead to 'enrolled' stage
    const completedStages: PipelineStage[] = [
      ...(lead.completed_stages || []),
      'enrolled' as PipelineStage
    ]

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        pipeline_stage: 'enrolled',
        completed_stages: completedStages,
        last_contacted_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('[Enrollment] Failed to update lead stage:', updateError)
      // Don't fail the whole operation - student is created
    }

    // 6. Update the payment transaction with student_id
    const { error: txError } = await supabase
      .from('payment_transactions')
      .update({
        student_id: student.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_by: userId,
      })
      .eq('id', transactionId)

    if (txError) {
      console.error('[Enrollment] Failed to update transaction:', txError)
      // Don't fail - student is created
    }

    // 7. Log the enrollment activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      student_id: student.id,
      activity_type: 'enrollment_completed',
      title: 'Enrolled',
      description: `${lead.first_name} ${lead.last_name} enrolled after paying ${amountPaid} KWD`,
      metadata: {
        transaction_id: transactionId,
        amount_paid: amountPaid,
        funding_type: lead.funding_type,
      },
      created_by: userId,
    })

    // 8. Log stage change activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      student_id: student.id,
      activity_type: 'stage_change',
      title: 'Stage Changed',
      description: `${lead.first_name} ${lead.last_name}: Application → Enrolled`,
      metadata: {
        old_stage: 'application',
        new_stage: 'enrolled',
        old_stage_label: 'Application',
        new_stage_label: 'Enrolled',
      },
      created_by: userId,
    })

    return {
      success: true,
      student: student as Student,
    }
  } catch (error) {
    console.error('[Enrollment] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert lead to student'
    }
  }
}

// Promote an SF lead from 'application' to 'applicant' after payment
export async function promoteSFLeadToApplicant(
  supabase: SupabaseClient,
  params: ConversionParams
): Promise<{ success: boolean; error?: string }> {
  const { leadId, transactionId, amountPaid, userId } = params

  try {
    // 1. Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return { success: false, error: leadError?.message || 'Lead not found' }
    }

    // 2. Validate: must be SF and in 'application' stage
    if (lead.funding_type !== 'self_funded') {
      return { success: false, error: 'Lead is not self-funded' }
    }

    if (lead.pipeline_stage !== 'application') {
      return {
        success: false,
        error: `Lead must be in 'application' stage. Current stage: ${lead.pipeline_stage}`,
      }
    }

    // 3. Move lead to 'applicant' stage
    const completedStages: PipelineStage[] = [
      ...(lead.completed_stages || []),
      'applicant' as PipelineStage,
    ]

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        pipeline_stage: 'applicant',
        completed_stages: completedStages,
        last_contacted_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('[SF Promotion] Failed to update lead stage:', updateError)
      return { success: false, error: `Failed to update lead: ${updateError.message}` }
    }

    // 4. Update the payment transaction
    const { error: txError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_by: userId,
      })
      .eq('id', transactionId)

    if (txError) {
      console.error('[SF Promotion] Failed to update transaction:', txError)
    }

    // 5. Log payment activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'payment_received',
      title: 'Payment Received (SF)',
      description: `${lead.first_name} ${lead.last_name} paid ${amountPaid} KWD — moved to Applicant`,
      metadata: {
        transaction_id: transactionId,
        amount_paid: amountPaid,
        funding_type: 'self_funded',
      },
      created_by: userId,
    })

    // 6. Log stage change activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'stage_change',
      title: 'Stage Changed',
      description: `${lead.first_name} ${lead.last_name}: Application → Applicant (SF payment)`,
      metadata: {
        old_stage: 'application',
        new_stage: 'applicant',
        old_stage_label: 'Application',
        new_stage_label: 'Applicant',
        reason: 'sf_payment',
      },
      created_by: userId,
    })

    return { success: true }
  } catch (error) {
    console.error('[SF Promotion] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote SF lead',
    }
  }
}

// Check if a lead can be enrolled (validation helper)
export async function canEnrollLead(
  supabase: SupabaseClient,
  leadId: string
): Promise<{ canEnroll: boolean; reason?: string }> {
  // Check lead exists and is in correct stage
  const { data: lead, error } = await supabase
    .from('leads')
    .select('pipeline_stage, civil_id')
    .eq('id', leadId)
    .single()

  if (error || !lead) {
    return { canEnroll: false, reason: 'Lead not found' }
  }

  if (lead.pipeline_stage !== 'application') {
    return {
      canEnroll: false,
      reason: `Lead must be in 'application' stage. Current: ${lead.pipeline_stage}`
    }
  }

  // Check no existing student
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('lead_id', leadId)
    .single()

  if (existingStudent) {
    return { canEnroll: false, reason: 'Student record already exists' }
  }

  return { canEnroll: true }
}
