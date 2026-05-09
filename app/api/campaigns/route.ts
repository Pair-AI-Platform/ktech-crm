import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { resolveFilterAudience } from '@/lib/campaigns/audience-resolver'

// Types
type CampaignType = 'voice' | 'whatsapp' | 'email'
type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
type AudienceSource = 'filter' | 'upload'
type ScheduleType = 'immediate' | 'scheduled' | 'optimal'

interface CreateCampaignRequest {
  name: string
  type: CampaignType
  audienceSource: AudienceSource
  audienceFilter?: string
  uploadedContacts?: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
  }[]
  scheduleType: ScheduleType
  scheduledDate?: string
  scheduledTime?: string
  messageContent?: string
  messageContentAr?: string
  subject?: string
  voiceWorkflowId?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
}

// GET - List campaigns
export const GET = withApiHandler(
  { context: 'campaigns', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('campaigns')
      .select('*, campaign_contacts(count)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error } = await query

    if (error) {
      logger.error('Error fetching campaigns', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  }
)

// POST - Create a new campaign
export const POST = withApiHandler(
  { context: 'campaigns-create', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const body: CreateCampaignRequest = await req.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate message content for non-voice campaigns
    if (body.type !== 'voice' && !body.messageContent) {
      return NextResponse.json(
        { error: 'Message content is required for this campaign type' },
        { status: 400 }
      )
    }

    // Validate email subject
    if (body.type === 'email' && !body.subject) {
      return NextResponse.json(
        { error: 'Subject is required for email campaigns' },
        { status: 400 }
      )
    }

    // Determine initial status
    let status: CampaignStatus = 'draft'
    let scheduledFor: string | null = null

    if (body.scheduleType === 'immediate') {
      status = 'active'
    } else if (body.scheduleType === 'scheduled' && body.scheduledDate) {
      status = 'scheduled'
      scheduledFor = body.scheduledTime
        ? `${body.scheduledDate}T${body.scheduledTime}:00`
        : `${body.scheduledDate}T09:00:00`
    }

    // Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        type: body.type,
        status,
        scheduled_for: scheduledFor,
        message_content: body.messageContent || null,
        message_content_ar: body.messageContentAr || null,
        subject: body.subject || null,
        voice_workflow_id: body.voiceWorkflowId || null,
        media_url: body.mediaUrl || null,
        media_type: body.mediaType || null,
        audience_source: body.audienceSource,
        audience_filter: body.audienceFilter || null,
        schedule_type: body.scheduleType,
        created_by: user.id,
        total_contacts: 0,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
      })
      .select()
      .single()

    if (campaignError) {
      logger.error('Error creating campaign', { error: campaignError.message, code: campaignError.code, details: campaignError.details, hint: campaignError.hint })
      return NextResponse.json(
        { error: `Failed to create campaign: ${campaignError.message}` },
        { status: 500 }
      )
    }

    // Validate uploaded contacts limit
    const MAX_CONTACTS = 1000
    if (body.uploadedContacts && body.uploadedContacts.length > MAX_CONTACTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CONTACTS} contacts allowed per upload` },
        { status: 400 }
      )
    }

    // Add contacts if uploaded
    if (body.audienceSource === 'upload' && body.uploadedContacts?.length) {
      const contacts = body.uploadedContacts.map(contact => ({
        campaign_id: campaign.id,
        first_name: contact.firstName,
        last_name: contact.lastName || '',
        phone: contact.phone || null,
        email: contact.email || null,
        status: 'pending',
      }))

      const { error: contactsError } = await supabase
        .from('campaign_contacts')
        .insert(contacts)

      if (contactsError) {
        logger.error('Error adding uploaded contacts', { error: contactsError.message })
      }

      // Update total contacts count
      await supabase
        .from('campaigns')
        .update({ total_contacts: contacts.length })
        .eq('id', campaign.id)
    }

    // If using filter, resolve leads and insert into campaign_contacts
    if (body.audienceSource === 'filter' && body.audienceFilter) {
      const audienceContacts = await resolveFilterAudience(supabase, body.audienceFilter)

      if (audienceContacts.length > 0) {
        const contacts = audienceContacts.map(contact => ({
          campaign_id: campaign.id,
          lead_id: contact.lead_id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone,
          email: contact.email || null,
          status: 'pending',
        }))

        const { error: contactsError } = await supabase
          .from('campaign_contacts')
          .insert(contacts)

        if (contactsError) {
          logger.error('Error adding filter contacts', { error: contactsError.message })
        }
      }

      await supabase
        .from('campaigns')
        .update({ total_contacts: audienceContacts.length })
        .eq('id', campaign.id)
    }

    // Log activity (non-blocking — don't fail campaign creation if this errors)
    await supabase.from('activities').insert({
      activity_type: 'campaign_created',
      title: `Campaign "${body.name}" created`,
      description: `${body.type} campaign created with ${body.scheduleType} scheduling`,
      metadata: {
        campaign_id: campaign.id,
        campaign_type: body.type,
        schedule_type: body.scheduleType,
      },
      created_by: user.id,
    }).then(({ error }) => {
      if (error) logger.warn('Failed to log campaign activity', { error: error.message })
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  }
)
