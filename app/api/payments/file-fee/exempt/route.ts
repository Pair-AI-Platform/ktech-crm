import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const POST = withApiHandler({ context: 'file-fee-exempt' }, async ({ req, supabase, user, logger }) => {
  const body = await req.json()
  const { leadId } = body

  if (!leadId) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
  }

  // Verify lead exists
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, first_name, last_name, pipeline_stage, file_fee_status')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
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
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      pipeline_stage: 'application',
      status: null,
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
  await supabase.from('activities').insert({
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
