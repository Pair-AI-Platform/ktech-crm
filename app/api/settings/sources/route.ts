import { withApiHandler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export const GET = withApiHandler(
  { context: 'get-sources' },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  }
)

export const POST = withApiHandler(
  { context: 'create-source', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { value, label, category } = await req.json()

    if (!value || !label || !category) {
      return NextResponse.json(
        { error: 'value, label, and category are required' },
        { status: 400 }
      )
    }

    const validCategories = ['direct', 'events', 'marketing', 'referrals', 'outreach']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Normalize value to snake_case
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

    // Check uniqueness
    const { data: existing } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('value', normalizedValue)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'A source with this value already exists' }, { status: 409 })
    }

    // Get max sort_order
    const { data: maxRow } = await supabase
      .from('lead_sources')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sortOrder = (maxRow?.sort_order ?? 0) + 1

    const { data, error } = await supabase
      .from('lead_sources')
      .insert({ value: normalizedValue, label, category, sort_order: sortOrder })
      .select()
      .single()

    if (error) throw error

    logger.info('Created lead source', { sourceId: data.id, value: normalizedValue })

    return NextResponse.json(data, { status: 201 })
  }
)

export const PUT = withApiHandler(
  { context: 'update-source', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id, label, category, is_active, sort_order } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (label !== undefined) updates.label = label
    if (category !== undefined) {
      const validCategories = ['direct', 'events', 'marketing', 'referrals', 'outreach']
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `category must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        )
      }
      updates.category = category
    }
    if (is_active !== undefined) updates.is_active = is_active
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data, error } = await supabase
      .from('lead_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info('Updated lead source', { sourceId: id })

    return NextResponse.json(data)
  }
)

export const DELETE = withApiHandler(
  { context: 'delete-source', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('lead_sources')
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info('Deleted lead source', { sourceId: id })

    return NextResponse.json({ success: true })
  }
)
