import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const runtime = 'edge'

export const GET = withApiHandler({ context: 'filter-presets-list' }, async ({ req, supabase, user, logger }) => {
  const { data, error } = await supabase
    .from('filter_presets')
    .select('*')
    .or(`user_id.eq.${user.id},is_shared.eq.true`)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Failed to fetch filter presets', { error: error.message })
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }

  return NextResponse.json({ presets: data })
})

export const POST = withApiHandler({ context: 'filter-presets-create' }, async ({ req, supabase, user, logger }) => {
  const body = await req.json()
  const { name, filters, is_shared } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('filter_presets')
    .insert({
      user_id: user.id,
      name,
      filters: filters || {},
      is_shared: is_shared || false,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create filter preset', { error: error.message })
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 })
  }

  logger.info('Filter preset created', { presetId: data.id, name })
  return NextResponse.json({ preset: data }, { status: 201 })
})

export const PUT = withApiHandler({ context: 'filter-presets-update' }, async ({ req, supabase, user, logger }) => {
  const body = await req.json()
  const { id, name, filters, is_shared } = body

  if (!id) {
    return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (filters !== undefined) updates.filters = filters
  if (is_shared !== undefined) updates.is_shared = is_shared

  const { data, error } = await supabase
    .from('filter_presets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update filter preset', { error: error.message, presetId: id })
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 })
  }

  logger.info('Filter preset updated', { presetId: id })
  return NextResponse.json({ preset: data })
})

export const DELETE = withApiHandler({ context: 'filter-presets-delete' }, async ({ req, supabase, user, logger }) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('filter_presets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    logger.error('Failed to delete filter preset', { error: error.message, presetId: id })
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
  }

  logger.info('Filter preset deleted', { presetId: id })
  return NextResponse.json({ success: true })
})
