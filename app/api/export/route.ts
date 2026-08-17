import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/api-handler'
import { generatePDFHTML, type ExportData } from '@/lib/export/pdf-generator'
import { generateCSV } from '@/lib/export/excel-generator'
import { PIPELINE_STAGES, LEAD_STATUSES } from '@/types'
import type { Lead } from '@/types'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

interface ExportRequest {
  type: 'pdf' | 'csv'
  entity: 'leads' | 'reports'
  filters?: {
    pipeline_stage?: string
    status?: string
    assigned_to?: string
    source?: string
    funding_type?: string
    date_from?: string
    date_to?: string
  }
}

const LEAD_EXPORT_COLUMNS: ExportData['columns'] = [
  { key: 'name', label: 'Name', width: 160 },
  { key: 'phone', label: 'Phone', width: 100 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'civil_id', label: 'Civil ID', width: 120 },
  { key: 'stage', label: 'Stage', width: 120 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'source', label: 'Source', width: 120 },
  { key: 'funding_type', label: 'Funding', width: 100 },
  { key: 'assigned_to_name', label: 'Assigned To', width: 140 },
  { key: 'created_at', label: 'Created', width: 120 },
]

function getStageLabel(stage: string): string {
  return PIPELINE_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function getStatusLabel(status: string): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status
}

function formatLeadRows(leads: Lead[]): ExportData['rows'] {
  return leads.map((lead) => ({
    name: `${lead.first_name_ar || ''} ${lead.last_name_ar || ''}`.trim(),
    phone: lead.phone,
    email: lead.email ?? '',
    civil_id: lead.civil_id ?? '',
    stage: getStageLabel(lead.pipeline_stage),
    status: lead.status ? getStatusLabel(lead.status) : '',
    source: lead.source ?? '',
    funding_type: lead.funding_type ?? '',
    assigned_to_name: ((lead as unknown as Record<string, unknown>).assigned_to_name as string) ?? '',
    created_at: lead.created_at
      ? new Date(lead.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '',
  }))
}

export const POST = withApiHandler(
  { context: 'export', roles: ['admin'] },
  async ({ req, supabase, user, logger }) => {
    const rateLimitResult = await rateLimit(`export:${user.id}`, RATE_LIMITS.export)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      )
    }

    const body = (await req.json()) as ExportRequest
    const { type, entity, filters } = body

    if (!type || !['pdf', 'csv'].includes(type)) {
      return NextResponse.json({ error: 'Invalid export type. Only PDF and CSV are supported.' }, { status: 400 })
    }

    if (!entity || !['leads', 'reports'].includes(entity)) {
      return NextResponse.json({ error: 'Invalid entity' }, { status: 400 })
    }

    let exportData: ExportData

    if (entity === 'leads') {
      let query = supabase
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5000)

      // Apply filters
      if (filters?.pipeline_stage) {
        query = query.eq('pipeline_stage', filters.pipeline_stage)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters?.source) {
        query = query.eq('source', filters.source)
      }
      if (filters?.funding_type) {
        query = query.eq('funding_type', filters.funding_type)
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data: leads, error } = await query

      if (error) {
        logger.error('Failed to fetch leads for export', { error: error.message })
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
      }

      const leadsWithNames = (leads ?? []).map((lead: Record<string, unknown>) => ({
        ...lead,
        assigned_to_name:
          (lead.profiles as Record<string, unknown> | null)?.full_name ?? '',
      }))

      const metadata: Record<string, string> = {
        'Total Records': String(leadsWithNames.length),
      }

      if (filters?.pipeline_stage) {
        metadata['Stage'] = getStageLabel(filters.pipeline_stage)
      }
      if (filters?.date_from || filters?.date_to) {
        metadata['Date Range'] = [filters.date_from, filters.date_to]
          .filter(Boolean)
          .join(' to ')
      }

      exportData = {
        title: 'Leads Export',
        subtitle: filters?.pipeline_stage
          ? `Stage: ${getStageLabel(filters.pipeline_stage)}`
          : 'All Leads',
        columns: LEAD_EXPORT_COLUMNS,
        rows: formatLeadRows(leadsWithNames as unknown as Lead[]),
        metadata,
      }
    } else {
      // Reports entity - provide a summary structure
      exportData = {
        title: 'Reports Export',
        subtitle: 'CRM Report Data',
        columns: [
          { key: 'metric', label: 'Metric', width: 200 },
          { key: 'value', label: 'Value', width: 150 },
        ],
        rows: [],
        metadata: { 'Generated At': new Date().toISOString() },
      }
    }

    logger.info('Generating export', { type, entity, rowCount: exportData.rows.length })

    switch (type) {
      case 'pdf': {
        const html = generatePDFHTML(exportData)
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${entity}-export.html"`,
          },
        })
      }

      case 'csv': {
        const csv = generateCSV(exportData)
        return new Response('\ufeff' + csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${entity}-export.csv"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 })
    }
  }
)
