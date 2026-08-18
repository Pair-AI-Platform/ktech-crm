import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'


export const GET = withApiHandler(
  { context: 'get-exhibitions' },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'create-exhibition', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { name } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Exhibition name is required' },
        { status: 400 }
      )
    }

    // Check uniqueness
    const { data: existing } = await supabase
      .from('exhibitions')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'An exhibition with this name already exists' }, { status: 409 })
    }

    // Get max sort_order
    const { data: maxRow } = await supabase
      .from('exhibitions')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (maxRow?.sort_order ?? 0) + 1

    const { data, error } = await supabase
      .from('exhibitions')
      .insert({ name: name.trim(), sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error

    logger.info('Created exhibition', { exhibitionId: data.id, name: name.trim() })

    return NextResponse.json(data, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-exhibition', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id, name, is_active, sort_order } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Exhibition ID is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name.trim()
    if (is_active !== undefined) updates.is_active = is_active
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('exhibitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info('Updated exhibition', { exhibitionId: id })

    return NextResponse.json(data)
  }
)

export const DELETE = withApiHandler(
  { context: 'delete-exhibition', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Exhibition ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info('Deleted exhibition', { exhibitionId: id })

    return NextResponse.json({ success: true })
  }
)
