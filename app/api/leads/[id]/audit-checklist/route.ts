import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'

export const runtime = 'edge'

export const dynamic = 'force-dynamic'

// The three manual auditor checklist items. Each maps to a boolean column plus
// _by / _at columns on the leads table so we record who confirmed it and when.
const ITEMS = {
  documents: {
    flag: 'auditor_check_documents',
    by: 'auditor_check_documents_by',
    at: 'auditor_check_documents_at',
  },
  preferences: {
    flag: 'auditor_check_preferences',
    by: 'auditor_check_preferences_by',
    at: 'auditor_check_preferences_at',
  },
  acceptance_match: {
    flag: 'auditor_check_acceptance_match',
    by: 'auditor_check_acceptance_match_by',
    at: 'auditor_check_acceptance_match_at',
  },
} as const

type ItemKey = keyof typeof ITEMS

// POST - tick/untick a manual auditor checklist item, or save notes (admin only).
// The leads audit trigger records this change in the audit trail automatically.
export const POST = withApiHandler(
  { context: 'lead-audit-checklist', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const id = req.nextUrl.pathname.split('/').slice(-2, -1)[0]
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { item, checked, notes } = body as {
      item?: ItemKey
      checked?: boolean
      notes?: string
    }

    const updateData: Record<string, unknown> = {}

    if (item !== undefined) {
      if (!(item in ITEMS)) {
        return NextResponse.json({ error: 'Invalid checklist item' }, { status: 400 })
      }
      if (typeof checked !== 'boolean') {
        return NextResponse.json({ error: 'checked must be a boolean' }, { status: 400 })
      }
      const cols = ITEMS[item]
      updateData[cols.flag] = checked
      updateData[cols.by] = checked ? user.id : null
      updateData[cols.at] = checked ? new Date().toISOString() : null
    }

    if (notes !== undefined) {
      updateData.auditor_check_notes = notes || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        auditor_check_documents, auditor_check_documents_at,
        auditor_check_documents_by_profile:profiles!auditor_check_documents_by(id, full_name, email),
        auditor_check_preferences, auditor_check_preferences_at,
        auditor_check_preferences_by_profile:profiles!auditor_check_preferences_by(id, full_name, email),
        auditor_check_acceptance_match, auditor_check_acceptance_match_at,
        auditor_check_acceptance_match_by_profile:profiles!auditor_check_acceptance_match_by(id, full_name, email),
        auditor_check_notes
      `)
      .single()

    if (error) {
      logger.error('Error updating auditor checklist', { error: error.message, leadId: id })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ checklist: data })
  }
)

// GET - read the current checklist state for a lead (admin only).
export const GET = withApiHandler(
  { context: 'lead-audit-checklist-get', roles: ['admin'] },
  async ({ req, supabase, logger }) => {
    const id = req.nextUrl.pathname.split('/').slice(-2, -1)[0]
    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        auditor_check_documents, auditor_check_documents_at,
        auditor_check_documents_by_profile:profiles!auditor_check_documents_by(id, full_name, email),
        auditor_check_preferences, auditor_check_preferences_at,
        auditor_check_preferences_by_profile:profiles!auditor_check_preferences_by(id, full_name, email),
        auditor_check_acceptance_match, auditor_check_acceptance_match_at,
        auditor_check_acceptance_match_by_profile:profiles!auditor_check_acceptance_match_by(id, full_name, email),
        auditor_check_notes
      `)
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching auditor checklist', { error: error.message, leadId: id })
      return NextResponse.json({ error: 'Operation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ checklist: data })
  }
)
