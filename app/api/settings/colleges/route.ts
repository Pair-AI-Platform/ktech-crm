import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'


export const GET = withApiHandler(
  { context: 'get-colleges' },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'create-college', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { name } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'College name is required' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('colleges')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'A college with this name already exists' }, { status: 409 })
    }

    const { data: maxRow } = await supabase
      .from('colleges')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (maxRow?.sort_order ?? 0) + 1

    const { data, error } = await supabase
      .from('colleges')
      .insert({ name: name.trim(), sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error

    logger.info('Created college', { collegeId: data.id, name: name.trim() })

    return NextResponse.json(data, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-college', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id, name, is_active, sort_order } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name.trim()
    if (is_active !== undefined) updates.is_active = is_active
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('colleges')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info('Updated college', { collegeId: id })

    return NextResponse.json(data)
  }
)

export const DELETE = withApiHandler(
  { context: 'delete-college', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'College ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('colleges')
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info('Deleted college', { collegeId: id })

    return NextResponse.json({ success: true })
  }
)
