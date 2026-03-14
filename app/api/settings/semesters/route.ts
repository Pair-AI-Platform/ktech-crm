import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

export const GET = withApiHandler(
  { context: 'get-semesters' },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('is_active', { ascending: false })
      .order('start_date', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'create-semester', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { name, start_date, end_date, is_active } = body

    if (!name || !start_date || !end_date) {
      return NextResponse.json({ error: 'Name, start_date, and end_date are required' }, { status: 400 })
    }

    // If setting as active, deactivate all others first
    if (is_active) {
      const { error: deactivateError } = await supabase
        .from('semesters')
        .update({ is_active: false })
        .eq('is_active', true)

      if (deactivateError) {
        logger.error('Failed to deactivate semesters', { error: deactivateError.message })
        throw deactivateError
      }
    }

    const { data, error } = await supabase
      .from('semesters')
      .insert({ name, start_date, end_date, is_active: is_active || false })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-semester', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Semester ID is required' }, { status: 400 })
    }

    // If toggling to active, deactivate all others first
    if (updates.is_active === true) {
      const { error: deactivateError } = await supabase
        .from('semesters')
        .update({ is_active: false })
        .neq('id', id)
        .eq('is_active', true)

      if (deactivateError) {
        logger.error('Failed to deactivate semesters', { error: deactivateError.message })
        throw deactivateError
      }
    }

    const { data, error } = await supabase
      .from('semesters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  }
)
