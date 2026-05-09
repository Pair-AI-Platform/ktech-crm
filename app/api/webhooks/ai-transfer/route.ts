import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { recordWebhookEvent, markWebhookProcessed, markWebhookFailed, hashPayload } from '@/lib/webhook-events'
import crypto from 'crypto'

interface AITransferBody {
  phone: string
  first_name: string
  last_name: string
  conversation_id?: string
  transfer_reason?: string
  notes?: string
  email?: string
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  // Strip Kuwait country code prefix
  if (cleaned.startsWith('+965')) cleaned = cleaned.slice(4)
  if (cleaned.startsWith('965') && cleaned.length > 8) cleaned = cleaned.slice(3)
  return cleaned
}

export const POST = withApiHandler(
  { context: 'ai-transfer-webhook', requireAuth: false },
  async ({ req, logger }) => {
    // 1. Validate API key
    const apiKey = req.headers.get('x-api-key')
    const secret = process.env.AI_TRANSFER_WEBHOOK_SECRET

    if (!secret || apiKey !== secret) {
      logger.warn('Unauthorized AI transfer attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`ai-transfer:${ip}`, RATE_LIMITS['ai-transfer'])
    if (!rl.success) {
      logger.warn('Rate limited', { ip, remaining: rl.remaining })
      return NextResponse.json(
        { error: 'Too many requests', retryAfterMs: rl.resetIn },
        { status: 429 }
      )
    }

    // 3. Parse and validate body
    const rawBody = await req.text()
    let body: AITransferBody
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.phone || !body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, first_name, last_name' },
        { status: 400 }
      )
    }

    const phone = normalizePhone(body.phone)
    if (phone.length < 7 || phone.length > 15) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Idempotency / replay protection. Use conversation_id when provided
    // (deterministic across retries from the same n8n run); otherwise hash
    // the body so identical retries dedup but a genuinely new transfer with
    // the same lead doesn't get blocked.
    const eventId = body.conversation_id
      ? `conv:${body.conversation_id}`
      : `body:${crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 32)}`
    const dedup = await recordWebhookEvent(supabase, 'ai_transfer', eventId, hashPayload(rawBody), null)
    if (!dedup.ok) {
      logger.info('AI transfer webhook deduplicated', { reason: dedup.reason, eventId })
      return NextResponse.json({ success: true, message: `Webhook ${dedup.reason}` })
    }

    // 4. Check for existing lead by phone
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, first_name, last_name, assigned_to, notes')
      .eq('phone', phone)
      .maybeSingle()

    // 5. Get next agent via round-robin
    const { data: rrData, error: rrError } = await supabase.rpc('assign_round_robin')
    if (rrError || !rrData || rrData.length === 0) {
      logger.error('Round-robin assignment failed', { error: rrError?.message })
      return NextResponse.json(
        { error: 'No active agents available' },
        { status: 503 }
      )
    }

    const assignedAgent = rrData[0]

    // Build AI notes
    const aiNotes = [
      body.transfer_reason ? `Transfer reason: ${body.transfer_reason}` : null,
      body.notes ? `AI notes: ${body.notes}` : null,
      body.conversation_id ? `Conversation ID: ${body.conversation_id}` : null,
    ].filter(Boolean).join('\n')

    const now = new Date().toISOString()
    let leadId: string
    let isNew: boolean

    if (existingLead) {
      // 6a. Update existing lead — re-assign + append notes
      isNew = false
      leadId = existingLead.id

      const updatedNotes = [existingLead.notes, `\n--- AI Transfer (${now}) ---\n${aiNotes}`]
        .filter(Boolean)
        .join('')

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          assigned_to: assignedAgent.agent_id,
          assigned_at: now,
          notes: updatedNotes,
        })
        .eq('id', leadId)

      if (updateError) {
        logger.error('Failed to update existing lead', { error: updateError.message, leadId })
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
      }

      logger.info('Updated existing lead via AI transfer', { leadId, agent: assignedAgent.agent_name })
    } else {
      // 6b. Create new lead
      isNew = true

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          first_name: body.first_name.trim(),
          last_name: body.last_name.trim(),
          phone,
          email: body.email?.trim() || null,
          source: 'whatsapp_ai',
          source_category: 'marketing',
          pipeline_stage: 'new',
          contact_status: 'uncontacted',
          nationality: 'Kuwaiti',
          is_kuwaiti: true,
          funding_type: 'self_funded',
          has_weyay_account: false,
          has_bank_account: false,
          assigned_to: assignedAgent.agent_id,
          assigned_at: now,
          notes: aiNotes || null,
        })
        .select('id')
        .single()

      if (insertError || !newLead) {
        logger.error('Failed to create lead', { error: insertError?.message })
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
      }

      leadId = newLead.id
      logger.info('Created new lead via AI transfer', { leadId, agent: assignedAgent.agent_name })
    }

    // 7. Create notification for assigned agent
    await createNotification(supabase, {
      userId: assignedAgent.agent_id,
      type: 'new_assignment',
      title: 'New AI Transfer',
      body: `Lead ${body.first_name} ${body.last_name} transferred from WhatsApp AI${body.transfer_reason ? `: ${body.transfer_reason}` : ''}`,
      leadId,
      actionUrl: `/leads?id=${leadId}`,
      metadata: {
        source: 'whatsapp_ai',
        conversation_id: body.conversation_id || null,
        is_new: isNew,
      },
    })

    // 8. Log activity
    await supabase.from('activities').insert({
      lead_id: leadId,
      activity_type: 'ai_transfer',
      description: `Lead ${isNew ? 'created' : 'updated'} via AI transfer and assigned to ${assignedAgent.agent_name}`,
      metadata: {
        conversation_id: body.conversation_id || null,
        transfer_reason: body.transfer_reason || null,
        assigned_agent_id: assignedAgent.agent_id,
        is_new: isNew,
      },
    }).then(({ error }) => {
      if (error) logger.warn('Failed to log activity', { error: error.message })
    })

    // 9. Mark webhook event processed (replay protection observability)
    await markWebhookProcessed(supabase, 'ai_transfer', eventId)

    // 10. Return result
    return NextResponse.json({
      success: true,
      lead_id: leadId,
      is_new: isNew,
      assigned_agent: {
        id: assignedAgent.agent_id,
        name: assignedAgent.agent_name,
        email: assignedAgent.agent_email,
      },
    })
  }
)
