import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const dynamic = 'force-dynamic'

export const GET = withApiHandler(
  { context: 'leads-list' },
  async ({ req, supabase, user, profile, logger }) => {
    const url = req.nextUrl
    const stage = url.searchParams.get('stage') || 'all'
    const fundingType = url.searchParams.get('fundingType') || 'all'
    const searchQuery = url.searchParams.get('search') || ''
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : undefined
    const pageSize = parseInt(url.searchParams.get('pageSize') || '25', 10)

    // Advanced filters from JSON param
    let advancedFilters: Record<string, any> = {}
    const filtersParam = url.searchParams.get('filters')
    if (filtersParam) {
      try { advancedFilters = JSON.parse(filtersParam) } catch {}
    }

    const usePagination = page !== undefined

    const buildQuery = (forCount: boolean) => {
      let q = supabase
        .from('leads')
        .select(
          forCount
            ? '*'
            : `
              *,
              school:schools(id, name_en, name_ar),
              assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, avatar_url),
              lost_reason:lost_reasons!leads_lost_reason_id_fkey(id, reason_en, reason_ar, category)
            `,
          forCount ? { count: 'exact', head: true } : undefined
        )

      if (!forCount) {
        q = q
          .order('position_in_stage', { ascending: true })
          .order('created_at', { ascending: false })
      }

      if (stage !== 'all') {
        q = q.eq('pipeline_stage', stage)
      }

      if (fundingType !== 'all') {
        q = q.eq('funding_type', fundingType)
      }

      if (searchQuery) {
        q = q.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,civil_id.ilike.%${searchQuery}%`)
      }

      // Advanced filters
      if (advancedFilters.statuses?.length > 0) {
        q = q.in('contact_status', advancedFilters.statuses)
      }
      if (advancedFilters.sources?.length > 0) {
        q = q.in('source', advancedFilters.sources)
      }
      if (advancedFilters.schools?.length > 0) {
        q = q.in('school_id', advancedFilters.schools)
      }
      if (advancedFilters.academicTrack && advancedFilters.academicTrack !== 'all') {
        q = q.eq('academic_track', advancedFilters.academicTrack)
      }
      if (advancedFilters.assignedTo) {
        q = q.eq('assigned_to', advancedFilters.assignedTo)
      }
      if (advancedFilters.isKuwaiti !== null && advancedFilters.isKuwaiti !== undefined) {
        q = q.eq('is_kuwaiti', advancedFilters.isKuwaiti)
      }
      if (advancedFilters.gpaMin !== null && advancedFilters.gpaMin !== undefined) {
        q = q.or(`gpa_grade_12_expected.gte.${advancedFilters.gpaMin},gpa_grade_11.gte.${advancedFilters.gpaMin},gpa_grade_10.gte.${advancedFilters.gpaMin}`)
      }
      if (advancedFilters.gpaMax !== null && advancedFilters.gpaMax !== undefined) {
        q = q.or(`gpa_grade_12_expected.lte.${advancedFilters.gpaMax},gpa_grade_11.lte.${advancedFilters.gpaMax},gpa_grade_10.lte.${advancedFilters.gpaMax}`)
      }
      if (advancedFilters.ministryBlocked === 'blocked') {
        q = q.eq('ministry_blocked', true)
      } else if (advancedFilters.ministryBlocked === 'not_blocked') {
        q = q.eq('ministry_blocked', false)
      }
      if (advancedFilters.ministryAssigned === 'assigned') {
        q = q.eq('ministry_assigned', true)
      } else if (advancedFilters.ministryAssigned === 'not_assigned') {
        q = q.or('ministry_assigned.is.null,ministry_assigned.eq.false')
      }
      if (advancedFilters.blockReasons?.length > 0) {
        q = q.in('submission_blocked_reason', advancedFilters.blockReasons)
      }
      if (advancedFilters.submissionSubstages?.length > 0) {
        q = q.in('submission_substage', advancedFilters.submissionSubstages)
      }
      if (advancedFilters.submissionStatuses?.length > 0) {
        q = q.in('submission_status', advancedFilters.submissionStatuses)
      }
      if (advancedFilters.lostAtStages?.length > 0) {
        q = q.in('lost_at_stage', advancedFilters.lostAtStages)
      }
      if (advancedFilters.lostAtFilter && advancedFilters.lostAtFilter !== 'all') {
        q = q.eq('lost_at_stage', advancedFilters.lostAtFilter)
      }
      if (advancedFilters.lostReasonIds?.length > 0) {
        q = q.in('lost_reason_id', advancedFilters.lostReasonIds)
      }
      if (advancedFilters.priority && advancedFilters.priority !== 'all') {
        q = q.eq('priority', advancedFilters.priority)
      }
      if (advancedFilters.hasNotes === 'with_notes') {
        q = q.neq('notes', '').not('notes', 'is', null)
      } else if (advancedFilters.hasNotes === 'without_notes') {
        q = q.or('notes.is.null,notes.eq.')
      }
      if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
        const now = new Date()
        let cutoff: Date
        switch (advancedFilters.dateRange) {
          case 'today':
            cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'quarter':
            cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          default:
            cutoff = new Date(0)
        }
        q = q.gte('created_at', cutoff.toISOString())
      }

      // Agent role: only own leads
      if (profile.role === 'agent') {
        q = q.eq('assigned_to', user.id)
      }

      return q
    }

    if (usePagination) {
      const offset = (page! - 1) * pageSize
      const [dataResult, countResult] = await Promise.all([
        buildQuery(false).range(offset, offset + pageSize - 1),
        buildQuery(true),
      ])

      if (dataResult.error) {
        logger.error('Query failed', { error: dataResult.error.message })
        return NextResponse.json({ error: dataResult.error.message }, { status: 500 })
      }

      return NextResponse.json({
        leads: dataResult.data || [],
        totalCount: countResult.count ?? 0,
      })
    } else {
      const dataResult = await buildQuery(false).limit(limit)

      if (dataResult.error) {
        logger.error('Query failed', { error: dataResult.error.message })
        return NextResponse.json({ error: dataResult.error.message }, { status: 500 })
      }

      return NextResponse.json({
        leads: dataResult.data || [],
        totalCount: dataResult.data?.length || 0,
      })
    }
  }
)
