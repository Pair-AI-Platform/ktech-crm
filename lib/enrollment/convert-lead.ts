// Lead to Student Conversion Utility
// Uses PostgreSQL RPC functions for atomic transactions

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
  // Bulk PUC import sets this to TRUE so the ministry acceptance list can
  // enroll a lead from any stage (lost/withdraw/etc.). Cash and online
  // payment flows leave it FALSE so the application-stage guard still applies.
  skipStageCheck?: boolean
}

// Convert a lead to a student after payment (atomic via PostgreSQL RPC)
export async function convertLeadToStudent(
  supabase: SupabaseClient,
  params: ConversionParams
): Promise<ConversionResult> {
  const { leadId, transactionId, amountPaid, userId, skipStageCheck } = params

  try {
    const { data, error } = await supabase.rpc('convert_lead_to_student', {
      p_lead_id: leadId,
      p_transaction_id: transactionId,
      p_amount_paid: amountPaid,
      p_user_id: userId || null,
      p_skip_stage_check: skipStageCheck ?? false,
    })

    if (error) {
      console.error('[Enrollment] RPC error:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
      }
    }

    const result = data as { success: boolean; error?: string; student?: Student; student_id?: string }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Conversion failed',
      }
    }

    return {
      success: true,
      student: result.student as Student,
    }
  } catch (error) {
    console.error('[Enrollment] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert lead to student'
    }
  }
}

// Promote an SF lead from 'application' to 'applicant' after payment (atomic via PostgreSQL RPC)
export async function promoteSFLeadToApplicant(
  supabase: SupabaseClient,
  params: ConversionParams
): Promise<{ success: boolean; error?: string }> {
  const { leadId, transactionId, amountPaid, userId } = params

  try {
    const { data, error } = await supabase.rpc('promote_sf_lead_to_applicant', {
      p_lead_id: leadId,
      p_transaction_id: transactionId,
      p_amount_paid: amountPaid,
      p_user_id: userId || null,
    })

    if (error) {
      console.error('[SF Promotion] RPC error:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
      }
    }

    const result = data as { success: boolean; error?: string }

    if (!result.success) {
      return { success: false, error: result.error || 'SF promotion failed' }
    }

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
