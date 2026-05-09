import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireLeadOwnership } from '@/lib/auth/lead-ownership'

export const POST = withApiHandler({ context: 'file-fee-exempt', roles: ['admin'] }, async ({ req, supabase, user, profile, logger }) => {
  const body = await req.json()
  const { leadId } = body

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
    .select('id, first_name, last_name, pipeline_stage, file_fee_status')
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

  // Update lead: exempt from fees and move to file stage
  const now = new Date().toISOString()
  const { error: updateError } = await serviceClient
    .from('leads')
    .update({
      pipeline_stage: 'application',
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
    description: `${lead.first_name} ${lead.last_name} was exempted from file stage fees`,
    metadata: {
      payment_purpose: 'file_fee',
      exempted_by: user.id,
    },
    created_by: user.id,
  })

  logger.info('Lead exempted from file fees, moved to file stage', { leadId })

  return NextResponse.json({
    success: true,
    message: 'Lead exempted from file fees and moved to File stage',
  })
})
