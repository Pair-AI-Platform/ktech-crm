import { NextRequest, NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { SCHOOLS, GOVERNORATES } from '@/types'

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

    const MAX_SEARCH_LENGTH = 100
    if (searchQuery && searchQuery.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json({ error: 'Search query too long' }, { status: 400 })
    }

    const usePagination = page !== undefined

    // Resolve school slugs to UUIDs
    let schoolIds: string[] | null = null
    if (advancedFilters.schools?.length > 0) {
      const schoolSlugs: string[] = advancedFilters.schools
      const schoolNames = schoolSlugs
        .map(slug => SCHOOLS.find(s => s.value === slug))
        .filter(Boolean)
        .map(s => s!.labelAr)

      if (schoolNames.length > 0) {
        const { data: schoolRows } = await supabase
          .from('schools')
          .select('id')
          .in('name_ar', schoolNames)
        schoolIds = schoolRows?.map(r => r.id) ?? []
      }
    }

    // Resolve governorate filter to school IDs
    let governorateSchoolIds: string[] | null = null
    if (advancedFilters.governorates?.length > 0) {
      const govSchoolNames = SCHOOLS
        .filter(s => s.governorate && advancedFilters.governorates.includes(s.governorate))
        .map(s => s.labelAr)
      if (govSchoolNames.length > 0) {
        const { data: govSchoolRows } = await supabase
          .from('schools')
          .select('id')
          .in('name_ar', govSchoolNames)
        governorateSchoolIds = govSchoolRows?.map(r => r.id) ?? []
      }
    }

    // Resolve campaign filter to lead IDs
    let campaignLeadIds: string[] | null = null
    if (advancedFilters.campaignIds?.length > 0) {
      const { data: contactRows } = await supabase
        .from('campaign_contacts')
        .select('lead_id')
        .in('campaign_id', advancedFilters.campaignIds)
        .not('lead_id', 'is', null)
      campaignLeadIds = [...new Set((contactRows || []).map(r => r.lead_id).filter(Boolean))]
      if (campaignLeadIds.length === 0) {
        // No leads match these campaigns — return empty result
        return NextResponse.json({ leads: [], totalCount: 0 })
      }
    }

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
      if (schoolIds && schoolIds.length > 0) {
        q = q.in('school_id', schoolIds)
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
      if (advancedFilters.ministryAssigned === 'assigned') {
        q = q.eq('ministry_assigned', true)
      } else if (advancedFilters.ministryAssigned === 'not_assigned') {
        q = q.or('ministry_assigned.is.null,ministry_assigned.eq.false')
      }
      if (advancedFilters.ministryFlagged === 'flagged') {
        q = q.eq('ministry_flagged', true)
      } else if (advancedFilters.ministryFlagged === 'not_flagged') {
        q = q.or('ministry_flagged.is.null,ministry_flagged.eq.false')
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
      if (advancedFilters.withdrawalReasons?.length > 0) {
        q = q.in('withdrawal_reason', advancedFilters.withdrawalReasons)
      }
      if (advancedFilters.genders?.length > 0) {
        q = q.in('gender', advancedFilters.genders)
      }
      if (governorateSchoolIds && governorateSchoolIds.length > 0) {
        q = q.in('school_id', governorateSchoolIds)
      }
      if (advancedFilters.hasNotes === 'with_notes') {
        q = q.neq('notes', '').not('notes', 'is', null)
      } else if (advancedFilters.hasNotes === 'without_notes') {
        q = q.or('notes.is.null,notes.eq.')
      }
      if (advancedFilters.dateRange && advancedFilters.dateRange !== 'all') {
        if (advancedFilters.dateRange === 'custom') {
          if (advancedFilters.dateFrom) {
            q = q.gte('created_at', new Date(advancedFilters.dateFrom).toISOString())
          }
          if (advancedFilters.dateTo) {
            const toDate = new Date(advancedFilters.dateTo)
            toDate.setHours(23, 59, 59, 999)
            q = q.lte('created_at', toDate.toISOString())
          }
        } else {
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
      }

      if (advancedFilters.docStatuses?.length > 0) {
        q = q.in('puc_document_status_override', advancedFilters.docStatuses)
      }
      if (advancedFilters.placementLevels?.length > 0) {
        q = q.in('placement_level', advancedFilters.placementLevels)
      }
      if (advancedFilters.semesterIds?.length > 0) {
        q = q.in('semester_id', advancedFilters.semesterIds)
      }
      if (campaignLeadIds) {
        q = q.in('id', campaignLeadIds)
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
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
      }

      return NextResponse.json({
        leads: dataResult.data || [],
        totalCount: countResult.count ?? 0,
      })
    } else {
      const dataResult = await buildQuery(false).limit(limit)

      if (dataResult.error) {
        logger.error('Query failed', { error: dataResult.error.message })
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
      }

      return NextResponse.json({
        leads: dataResult.data || [],
        totalCount: dataResult.data?.length || 0,
      })
    }
  }
)
