import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'


export const GET = withApiHandler(
  { context: 'get-cycles' },
  async ({ supabase }) => {
    // Fetch all cycles
    const { data: cycles, error: cyclesError } = await supabase
      .from('education_cycles')
      .select('*')
      .order('is_active', { ascending: false })
      .order('start_year', { ascending: false })

    if (cyclesError) throw cyclesError

    // Fetch all semesters with cycle_id
    const { data: terms, error: termsError } = await supabase
      .from('semesters')
      .select('*')
      .not('cycle_id', 'is', null)
      .order('start_date', { ascending: true })

    if (termsError) throw termsError

    // Group terms under their cycles
    const cyclesWithTerms = (cycles || []).map((cycle) => ({
      ...cycle,
      terms: (terms || []).filter((t) => t.cycle_id === cycle.id),
    }))

    return NextResponse.json(cyclesWithTerms)
  }
)

export const POST = withApiHandler(
  { context: 'create-cycle', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { start_year, end_year } = body

    if (!start_year || !end_year || end_year !== start_year + 1) {
      return NextResponse.json(
        { error: 'Valid start_year and end_year (consecutive) are required' },
        { status: 400 }
      )
    }

    const name = `${start_year}-${end_year}`

    // Check if cycle already exists
    const { data: existing } = await supabase
      .from('education_cycles')
      .select('id')
      .eq('start_year', start_year)
      .eq('end_year', end_year)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: `Cycle ${name} already exists` }, { status: 409 })
    }

    // Create cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('education_cycles')
      .insert({ name, start_year, end_year, is_active: false })
      .select()
      .single()

    if (cycleError) throw cycleError

    // Auto-create Fall and Spring terms (allow custom dates)
    const terms = [
      {
        name: `Fall ${start_year}`,
        start_date: body.fall_start_date || `${start_year}-09-01`,
        end_date: body.fall_end_date || `${end_year}-01-31`,
        is_active: false,
        is_open: false,
        cycle_id: cycle.id,
        term_type: 'fall',
      },
      {
        name: `Spring ${end_year}`,
        start_date: body.spring_start_date || `${end_year}-02-01`,
        end_date: body.spring_end_date || `${end_year}-06-30`,
        is_active: false,
        is_open: false,
        cycle_id: cycle.id,
        term_type: 'spring',
      },
    ]

    const { data: createdTerms, error: termsError } = await supabase
      .from('semesters')
      .insert(terms)
      .select()

    if (termsError) throw termsError

    logger.info('Created education cycle', { cycleId: cycle.id, name, terms: createdTerms?.length })

    return NextResponse.json({ ...cycle, terms: createdTerms }, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-cycle', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { id, is_active, name } = body

    if (!id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 })
    }

    // If activating this cycle, deactivate all others first
    if (is_active === true) {
      // Deactivate all cycles
      await supabase
        .from('education_cycles')
        .update({ is_active: false })
        .neq('id', id)

      // Deactivate all semesters and close them
      await supabase
        .from('semesters')
        .update({ is_active: false, is_open: false })
        .not('cycle_id', 'eq', id)

      // Activate the target cycle
      const { error: cycleError } = await supabase
        .from('education_cycles')
        .update({ is_active: true })
        .eq('id', id)

      if (cycleError) throw cycleError

      // Activate and open all terms of this cycle
      const { error: termsError } = await supabase
        .from('semesters')
        .update({ is_active: true, is_open: true })
        .eq('cycle_id', id)

      if (termsError) throw termsError

      logger.info('Activated education cycle', { cycleId: id })
    } else if (is_active === false) {
      // Deactivating a cycle
      const { error: cycleError } = await supabase
        .from('education_cycles')
        .update({ is_active: false })
        .eq('id', id)

      if (cycleError) throw cycleError

      // Deactivate and close all terms
      const { error: termsError } = await supabase
        .from('semesters')
        .update({ is_active: false, is_open: false })
        .eq('cycle_id', id)

      if (termsError) throw termsError

      logger.info('Deactivated education cycle', { cycleId: id })
    }

    // Update name if provided
    if (name) {
      const { error } = await supabase
        .from('education_cycles')
        .update({ name })
        .eq('id', id)

      if (error) throw error
    }

    // Return updated cycle with terms
    const { data: updatedCycle, error: fetchError } = await supabase
      .from('education_cycles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const { data: terms } = await supabase
      .from('semesters')
      .select('*')
      .eq('cycle_id', id)
      .order('start_date', { ascending: true })

    return NextResponse.json({ ...updatedCycle, terms: terms || [] })
  }
)
