import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const GET = withApiHandler(
  { context: 'sms-templates-list' },
  async ({ supabase, logger }) => {
    const { data: templates, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      logger.error('Failed to fetch SMS templates', { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  }
)

export const POST = withApiHandler(
  { context: 'sms-templates-create' },
  async ({ req, supabase, user, logger }) => {
    const body = await req.json()

    // Extract variables from content (format: {{variable_name}})
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    let match
    while ((match = variableRegex.exec(body.content_en)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    const { data: template, error } = await supabase
      .from('sms_templates')
      .insert({
        name: body.name,
        category: body.category,
        content_en: body.content_en,
        content_ar: body.content_ar || null,
        variables,
        is_active: body.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create SMS template', { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ template })
  }
)

export const PUT = withApiHandler(
  { context: 'sms-templates-update' },
  async ({ req, supabase, logger }) => {
    const body = await req.json()

    // Extract variables from content
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    let match
    while ((match = variableRegex.exec(body.content_en)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    const { data: template, error } = await supabase
      .from('sms_templates')
      .update({
        name: body.name,
        category: body.category,
        content_en: body.content_en,
        content_ar: body.content_ar || null,
        variables,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update SMS template', { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ template })
  }
)

export const DELETE = withApiHandler(
  { context: 'sms-templates-delete' },
  async ({ req, supabase, logger }) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('Failed to delete SMS template', { error: error.message })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)
