import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'


export const GET = withApiHandler(
  { context: 'get-puc-periods' },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('puc_periods')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'create-puc-period', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { name, start_date, end_date, set_active } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Period name is required' }, { status: 400 })
    }
    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }
    if (end_date <= start_date) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // If setting as active, archive the current active period first
    if (set_active !== false) {
      const { error: archiveErr } = await supabase
        .from('puc_periods')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('status', 'active')

      if (archiveErr) throw archiveErr
    }

    const { data, error } = await supabase
      .from('puc_periods')
      .insert({
        name: name.trim(),
        start_date,
        end_date,
        status: set_active !== false ? 'active' : 'archived',
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Created PUC period', { periodId: data.id, name: name.trim(), start_date, end_date })

    return NextResponse.json(data, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-puc-period', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id, name, start_date, end_date, status } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Period ID is required' }, { status: 400 })
    }

    // If activating this period, archive the currently active one first
    if (status === 'active') {
      const { error: archiveErr } = await supabase
        .from('puc_periods')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('status', 'active')
        .neq('id', id)

      if (archiveErr) throw archiveErr
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name.trim()
    if (start_date !== undefined) updates.start_date = start_date
    if (end_date !== undefined) updates.end_date = end_date
    if (status !== undefined) updates.status = status

    const { data, error } = await supabase
      .from('puc_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info('Updated PUC period', { periodId: id, status })

    return NextResponse.json(data)
  }
)

export const DELETE = withApiHandler(
  { context: 'delete-puc-period', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Period ID is required' }, { status: 400 })
    }

    // Only allow deleting archived periods
    const { data: period } = await supabase
      .from('puc_periods')
      .select('status')
      .eq('id', id)
      .single()

    if (period?.status === 'active') {
      return NextResponse.json({ error: 'Cannot delete an active period. Archive it first.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('puc_periods')
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info('Deleted PUC period', { periodId: id })

    return NextResponse.json({ success: true })
  }
)
