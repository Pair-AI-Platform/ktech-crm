import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

export const GET = withApiHandler(
  { context: 'lead-detail' },
  async ({ req, supabase, user, profile, logger }) => {
    const id = req.nextUrl.pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        school:schools(id, name_en, name_ar, school_type),
        assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
        lost_reason:lost_reasons!leads_lost_reason_id_fkey(id, reason_en, reason_ar, category),
        semester:semesters(id, name, is_active)
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Lead query failed', { error: error.message, id })
      return NextResponse.json(
        { error: error.code === 'PGRST116' ? 'Lead not found' : 'Failed to fetch lead' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // Defense in depth on top of leads_select_policy: agents can only read
    // their own leads. If RLS regresses for any reason, this guard still
    // closes the IDOR path.
    if (profile?.role !== 'admin' && data.assigned_to !== user.id) {
      logger.warn('Agent attempted to access non-owned lead', { leadId: id, agentId: user.id })
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Auto-assign to active cycle's open term if lead has no semester
    if (!data.semester_id) {
      const { data: openTerm } = await supabase
        .from('semesters')
        .select('id, name, is_active, cycle_id')
        .eq('is_active', true)
        .eq('is_open', true)
        .limit(1)
        .single()

      if (openTerm) {
        await supabase
          .from('leads')
          .update({ semester_id: openTerm.id })
          .eq('id', data.id)

        data.semester_id = openTerm.id
        data.semester = { id: openTerm.id, name: openTerm.name, is_active: openTerm.is_active }
      }
    }

    return NextResponse.json(data)
  }
)
