import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'


const ALLOWED_TARGET_STAGES = ['application', 'applicant', 'enrolled'] as const
type AllowedTargetStage = (typeof ALLOWED_TARGET_STAGES)[number]

export const POST = withApiHandler({ context: 'tuition-exempt', roles: ['admin'] }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId, note, targetStage } = body as {
    leadId?: string
    note?: string
    targetStage?: string
  }

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  if (!note || typeof note !== 'string' || note.trim() === '') {
    return NextResponse.json({ error: 'An exemption note is required' }, { status: 400 })
  }

  if (!targetStage || !ALLOWED_TARGET_STAGES.includes(targetStage as AllowedTargetStage)) {
    return NextResponse.json({ error: 'A valid target stage is required' }, { status: 400 })
  }

  const ownershipBlock = await requireLeadOwnership(supabase, { userId: user.id, role: profile?.role }, leadId)
  if (ownershipBlock) return ownershipBlock

  // Service role to bypass RLS for the update.
  const serviceClient = createServiceRoleClient()

  const { data: lead, error: leadError } = await serviceClient
    .from('leads')
    .select('id, first_name, last_name, pipeline_stage, funding_type, payment_exempt')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    logger.error('Lead not found for tuition exemption', { leadId, error: leadError?.message })
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (lead.funding_type !== 'self_funded') {
    return NextResponse.json({ error: 'Tuition exemption only applies to self-funded leads' }, { status: 400 })
  }

  const now = new Date().toISOString()
  await serviceClient.rpc('shift_stage_positions', { target_stage: targetStage })

  const { error: updateError } = await serviceClient
    .from('leads')
    .update({
      pipeline_stage: targetStage,
      position_in_stage: 0,
      last_contacted_at: now,
      payment_exempt: true,
      payment_exempt_note: note.trim(),
      payment_exempt_by: user.id,
      payment_exempt_at: now,
    })
    .eq('id', leadId)

  if (updateError) {
    logger.error('Failed to exempt lead from tuition payment', { leadId, error: updateError.message })
    return NextResponse.json({ error: 'Failed to exempt lead from tuition payment' }, { status: 500 })
  }

  await serviceClient.from('activities').insert({
    lead_id: leadId,
    activity_type: 'fee_exemption',
    title: 'Tuition Payment Exemption',
    description: `${lead.first_name} ${lead.last_name} was exempted from the tuition payment requirement and moved to ${targetStage}. Note: ${note.trim()}`,
    metadata: {
      payment_purpose: 'tuition',
      exempted_by: user.id,
      target_stage: targetStage,
      note: note.trim(),
    },
    created_by: user.id,
  })

  logger.info('Lead exempted from tuition payment', { leadId, targetStage })

  return NextResponse.json({
    success: true,
    message: 'Lead exempted from tuition payment',
  })
})
