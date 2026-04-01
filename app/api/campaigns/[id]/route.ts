import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single campaign with contacts
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const handler = withApiHandler(
    { context: 'campaign-detail', roles: ['admin'] },
    async ({ supabase, logger }) => {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_contacts(
            id,
            lead_id,
            first_name,
            last_name,
            phone,
            email,
            status,
            sent_at,
            delivered_at,
            error_message
          )
        `)
        .eq('id', id)
        .single()

      if (error || !campaign) {
        logger.warn('Campaign not found', { id })
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      return NextResponse.json({ campaign })
    }
  )
  return handler(request)
}

// PUT - Update campaign
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const handler = withApiHandler(
    { context: 'campaign-update', roles: ['admin'] },
    async ({ req, supabase, user, logger }) => {
      const body = await req.json()

      // Get current campaign
      const { data: currentCampaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !currentCampaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      // Only allow certain fields to be updated based on status
      if (currentCampaign.status === 'draft' || currentCampaign.status === 'scheduled') {
        if (body.name) updateData.name = body.name
        if (body.messageContent !== undefined) updateData.message_content = body.messageContent
        if (body.messageContentAr !== undefined) updateData.message_content_ar = body.messageContentAr
        if (body.subject !== undefined) updateData.subject = body.subject
        if (body.scheduledDate && body.scheduledTime) {
          updateData.scheduled_for = `${body.scheduledDate}T${body.scheduledTime}:00`
        }
      }

      // Status changes
      if (body.status) {
        const validTransitions: Record<string, string[]> = {
          draft: ['scheduled', 'active'],
          scheduled: ['active', 'draft'],
          active: ['paused', 'completed'],
          paused: ['active', 'completed'],
          completed: [],
        }

        if (!validTransitions[currentCampaign.status]?.includes(body.status)) {
          return NextResponse.json(
            { error: `Cannot transition from ${currentCampaign.status} to ${body.status}` },
            { status: 400 }
          )
        }

        updateData.status = body.status

        // Track status change timestamps
        if (body.status === 'active' && !currentCampaign.started_at) {
          updateData.started_at = new Date().toISOString()
        }
        if (body.status === 'completed') {
          updateData.completed_at = new Date().toISOString()
        }
        if (body.status === 'paused') {
          updateData.paused_at = new Date().toISOString()
        }
      }

      const { data: campaign, error: updateError } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        logger.error('Error updating campaign', { error: updateError.message })
        return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
      }

      // Log activity
      await supabase.from('activities').insert({
        activity_type: 'campaign_updated',
        title: `Campaign "${campaign.name}" updated`,
        description: body.status ? `Status changed to ${body.status}` : 'Campaign settings updated',
        metadata: {
          campaign_id: id,
          changes: Object.keys(updateData),
        },
        created_by: user.id,
      })

      return NextResponse.json({ success: true, campaign })
    }
  )
  return handler(request)
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const handler = withApiHandler(
    { context: 'campaign-delete', roles: ['admin'] },
    async ({ supabase, user, logger }) => {
      // Get campaign first
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      // Only allow deletion of draft/scheduled/paused/completed campaigns
      if (campaign.status === 'active') {
        return NextResponse.json(
          { error: 'Cannot delete an active campaign. Pause it first.' },
          { status: 400 }
        )
      }

      // Delete campaign (cascade deletes contacts)
      const { error: deleteError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (deleteError) {
        logger.error('Error deleting campaign', { error: deleteError.message })
        return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
      }

      // Log activity
      await supabase.from('activities').insert({
        activity_type: 'campaign_deleted',
        title: `Campaign "${campaign.name}" deleted`,
        metadata: {
          campaign_id: id,
          campaign_name: campaign.name,
          campaign_type: campaign.type,
        },
        created_by: user.id,
      })

      return NextResponse.json({ success: true })
    }
  )
  return handler(request)
}
