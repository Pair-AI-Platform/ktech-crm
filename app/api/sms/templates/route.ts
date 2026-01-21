import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: templates, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
