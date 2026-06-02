import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'
import { getMissingPspSelfServiceFields } from '@/lib/psp/self-service-requirements'

export const POST = withApiHandler({ context: 'file-fee-exempt', roles: ['admin'] }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId, targetStage: rawTargetStage } = body

  // The file fee gates entry to the Test stage; 'application' is kept for
  // legacy / reactivation flows.
  const targetStage: 'test' | 'application' = rawTargetStage === 'test' ? 'test' : 'application'
  const targetStageLabel = targetStage === 'test' ? 'Test' : 'File'

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role }, leadId)
  if (ownershipBlock) return ownershipBlock

  // Use service role to bypass RLS for the update
  const serviceClient = createServiceRoleClient()

  // Verify lead exists
  const { data: lead, error: leadError } = await serviceClient
    .from('leads')
    .select('id, first_name, last_name, phone, civil_id, education_type, pipeline_stage, file_fee_status')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    logger.error('Lead not found for file fee exemption', { leadId, error: leadError?.message })
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (lead.file_fee_status === 'paid') {
    return NextResponse.json({ error: 'File fees have already been paid for this lead' }, { status: 409 })
  }

  if (lead.file_fee_status === 'exempt') {
    return NextResponse.json({ error: 'Lead has already been exempted from file fees' }, { status: 409 })
  }

  // File-stage academic requirements are only enforced when unlocking the File
  // stage. Exempting the Test-entry fee does not require them.
  if (targetStage === 'application') {
    const missingFields = getMissingPspSelfServiceFields(lead)
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Complete ${missingFields.join(', ')} before moving this lead to File.` },
        { status: 400 }
      )
    }
  }

  // Update lead: exempt from fees and move to the target stage
  const now = new Date().toISOString()
  await serviceClient.rpc('shift_stage_positions', { target_stage: targetStage })

  const { error: updateError } = await serviceClient
    .from('leads')
    .update({
      pipeline_stage: targetStage,
      position_in_stage: 0,
      last_contacted_at: now,
      file_fee_status: 'exempt',
      file_fee_exempted: true,
      file_fee_exempted_by: user.id,
      file_fee_exempted_at: now,
    })
    .eq('id', leadId)

  if (updateError) {
    logger.error('Failed to exempt lead from file fees', { leadId, error: updateError.message })
    return NextResponse.json({ error: 'Failed to exempt lead from file fees' }, { status: 500 })
  }

  // Log activity
  await serviceClient.from('activities').insert({
    lead_id: leadId,
    activity_type: 'fee_exemption',
    title: 'File Fee Exemption',
    description: `${lead.first_name} ${lead.last_name} was exempted from file stage fees and moved to ${targetStageLabel} stage`,
    metadata: {
      payment_purpose: 'file_fee',
      exempted_by: user.id,
      target_stage: targetStage,
    },
    created_by: user.id,
  })

  logger.info('Lead exempted from file fees, moved to target stage', { leadId, targetStage })

  return NextResponse.json({
    success: true,
    message: `Lead exempted from file fees and moved to ${targetStageLabel} stage`,
  })
})
