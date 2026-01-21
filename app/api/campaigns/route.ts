import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Types
type CampaignType = 'voice' | 'whatsapp' | 'sms' | 'email'
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
}

// GET - List campaigns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
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
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCampaignRequest = await request.json()

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
      console.error('Error creating campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
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
        console.error('Error adding campaign contacts:', contactsError)
        // Don't fail the request, just log the error
      }

      // Update total contacts count
      await supabase
        .from('campaigns')
        .update({ total_contacts: contacts.length })
        .eq('id', campaign.id)
    }

    // If using filter, get count of matching leads
    if (body.audienceSource === 'filter' && body.audienceFilter) {
      // This would typically query leads based on the filter
      // For now, we'll set a placeholder count
      const filterCounts: Record<string, number> = {
        previous_students: 127,
        new_leads_30: 256,
        new_leads_7: 89,
        upcoming_appointments: 34,
        outstanding_payments: 45,
        no_contact: 178,
        callback_requested: 23,
      }

      const count = filterCounts[body.audienceFilter] || 0

      await supabase
        .from('campaigns')
        .update({ total_contacts: count })
        .eq('id', campaign.id)
    }

    // Log activity
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
    })

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
