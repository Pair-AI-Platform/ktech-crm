import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'
import { assertArabicLeadNameFields, getArabicLeadDisplayName } from '@/lib/lead-name-policy'


export const POST = withApiHandler(
  { context: 're-register-leads', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const { lead_ids, target_semester_id, assigned_to } = await req.json()

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 })
    }

    // Get target semester: use provided ID, or find first open term in active cycle
    let activeSemester: { id: string; name: string } | null = null

    if (target_semester_id) {
      const { data, error } = await supabase
        .from('semesters')
        .select('id, name')
        .eq('id', target_semester_id)
        .single()
      if (error || !data) {
        return NextResponse.json({ error: 'Invalid target semester' }, { status: 400 })
      }
      activeSemester = data
    } else {
      // Find first open term in active cycle
      const { data, error } = await supabase
        .from('semesters')
        .select('id, name, cycle:education_cycles!inner(is_active)')
        .eq('is_open', true)
        .eq('education_cycles.is_active', true)
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!data) {
        // Fallback: any active semester
        const { data: fallback } = await supabase
          .from('semesters')
          .select('id, name')
          .eq('is_active', true)
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle()
        activeSemester = fallback
      } else {
        activeSemester = { id: data.id, name: data.name }
      }
    }

    if (!activeSemester) {
      return NextResponse.json({ error: 'No active semester found' }, { status: 400 })
    }

    // Fetch source leads
    const { data: sourceLeads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .in('id', lead_ids)

    if (fetchError) throw fetchError
    if (!sourceLeads || sourceLeads.length === 0) {
      return NextResponse.json({ error: 'No leads found' }, { status: 404 })
    }

    // Check for civil_ids that ALREADY exist in the target semester. civil_id
    // repeats across cycles by design (re_registered_from links old→new), so the
    // duplicate check must be scoped to the destination term — otherwise every
    // lead that exists in any prior cycle is wrongly skipped.
    const civilIds = sourceLeads.map((l) => l.civil_id).filter(Boolean)
    let existingCivilIds = new Set<string>()
    if (civilIds.length > 0) {
      const { data: existing } = await supabase
        .from('leads')
        .select('civil_id')
        .in('civil_id', civilIds)
        .eq('semester_id', activeSemester.id)
      existingCivilIds = new Set((existing || []).map((e) => e.civil_id))
    }

    // Split leads into transferable and skipped (already exist)
    const skippedLeads = sourceLeads.filter((l) => l.civil_id && existingCivilIds.has(l.civil_id))
    const transferableLeads = sourceLeads.filter((l) => !l.civil_id || !existingCivilIds.has(l.civil_id))

    if (transferableLeads.length === 0) {
      const names = skippedLeads.map((l) => getArabicLeadDisplayName(l)).join(', ')
      return NextResponse.json(
        { error: `All selected leads already exist in the active cycle: ${names}` },
        { status: 409 }
      )
    }

    let newLeads: Array<Record<string, unknown>>
    try {
      // Build new leads with kept fields, reset pipeline fields
      newLeads = transferableLeads.map((lead) => {
        const normalizedName = assertArabicLeadNameFields(lead, {
          requireFirstName: true,
          requireLastName: true,
        })

        return {
          // Kept fields
          first_name: normalizedName.first_name,
          last_name: normalizedName.last_name,
          first_name_ar: normalizedName.first_name,
          last_name_ar: normalizedName.last_name,
          civil_id: lead.civil_id,
          phone: lead.phone,
          phone_secondary: lead.phone_secondary,
          email: lead.email,
          date_of_birth: lead.date_of_birth,
          gender: lead.gender,
          nationality: lead.nationality,
          is_kuwaiti: lead.is_kuwaiti,
          is_transfer_student: lead.is_transfer_student,
          is_special_needs: lead.is_special_needs,
          is_diplomatic: lead.is_diplomatic,
          is_athlete: lead.is_athlete,
          is_married: lead.is_married,
          is_employee: lead.is_employee,
          school_id: lead.school_id,
          school_name_custom: lead.school_name_custom,
          education_type: lead.education_type,
          education_type_custom: lead.education_type_custom,
          grade_level: lead.grade_level,
          academic_track: lead.academic_track,
          funding_type: lead.funding_type,
          source: lead.source,
          source_category: lead.source_category,
          // Reset fields
          pipeline_stage: 'new',
          status: null,
          contact_status: null,
          notes: null,
          position_in_stage: null,
          contact_count: 0,
          lost_reason_id: null,
          lost_reason_notes: null,
          lost_at_stage: null,
          // Set semester & provenance
          semester_id: activeSemester.id,
          re_registered_from: lead.id,
          assigned_to: assigned_to || user.id,
          assigned_at: new Date().toISOString(),
        }
      })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Lead name must be in Arabic' },
        { status: 400 }
      )
    }

    const { data: created, error: insertError } = await supabase
      .from('leads')
      .insert(newLeads)
      .select('id')

    if (insertError) throw insertError

    logger.info('Re-registered leads', {
      count: created?.length ?? 0,
      skipped: skippedLeads.length,
      sourceSemester: sourceLeads[0]?.semester_id,
      targetSemester: activeSemester.id,
    })

    return NextResponse.json({
      count: created?.length ?? 0,
      skipped: skippedLeads.length,
      skippedNames: skippedLeads.map((l) => getArabicLeadDisplayName(l)),
    })
  }
)
