import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const POST = withApiHandler(
  { context: 'announcements', roles: ['admin'] },
  async ({ req, user, logger }) => {
    const { title, message } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get all active agent profiles
    const serviceClient = createServiceRoleClient()
    const { data: agents, error: agentsError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('is_active', true)

    if (agentsError) {
      logger.error('Failed to fetch agents', { error: agentsError.message })
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'No active agents found' }, { status: 404 })
    }

    const notifications = agents.map((agent) => ({
      user_id: agent.id,
      type: 'system_alert' as const,
      title: `📢 ${title.trim()}`,
      body: message?.trim() || null,
      is_read: false,
      created_by: user.id,
      metadata: { announcement: true },
    }))

    const { error: insertError } = await serviceClient
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      logger.error('Failed to insert announcements', { error: insertError.message })
      return NextResponse.json({ error: 'Failed to send announcement' }, { status: 500 })
    }

    logger.info('Announcement sent', { count: agents.length, title: title.trim() })
    return NextResponse.json({ success: true, count: agents.length })
  }
)
