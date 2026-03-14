import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

export const POST = withApiHandler(
  { context: 're-register-leads', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const { lead_ids } = await req.json()

    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 })
    }

    // Get active semester
    const { data: activeSemester, error: semError } = await supabase
      .from('semesters')
      .select('id, name')
      .eq('is_active', true)
      .single()

    if (semError || !activeSemester) {
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

    // Build new leads with kept fields, reset pipeline fields
    const newLeads = sourceLeads.map((lead) => ({
      // Kept fields
      first_name: lead.first_name,
      last_name: lead.last_name,
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
      assigned_to: user.id,
      assigned_at: new Date().toISOString(),
    }))

    const { data: created, error: insertError } = await supabase
      .from('leads')
      .insert(newLeads)
      .select('id')

    if (insertError) throw insertError

    logger.info('Re-registered leads', {
      count: created?.length ?? 0,
      sourceSemester: sourceLeads[0]?.semester_id,
      targetSemester: activeSemester.id,
    })

    return NextResponse.json({ count: created?.length ?? 0 })
  }
)
