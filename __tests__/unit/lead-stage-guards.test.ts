import { describe, it, expect } from 'vitest'
import { checkStageTransition, getMissingSfDocuments } from '@/lib/lead-stage-guards'
import { SF_DOCUMENTS } from '@/types'
import type { Lead } from '@/types'

// Minimal SF lead in the File (application) stage with all docs submitted and
// full tuition paid. Tests override individual fields as needed.
function sfLead(overrides: Partial<Lead> = {}): Lead {
  const allDocsTrue = Object.fromEntries(SF_DOCUMENTS.map((d) => [d.key, true]))
  return {
    id: 'lead-1',
    funding_type: 'self_funded',
    pipeline_stage: 'application',
    payment_exempt: false,
    file_fee_status: 'paid',
    ...allDocsTrue,
    ...overrides,
  } as unknown as Lead
}

describe('checkStageTransition — SF documents gate', () => {
  it('blocks Applicant when documents are missing (even with full tuition paid)', () => {
    const lead = sfLead({ sf_passport_submitted: false } as Partial<Lead>)
    const result = checkStageTransition({ lead, newStage: 'applicant', amountPaid: 550 })
    expect(result.kind).toBe('sf_documents')
    if (result.kind === 'sf_documents') {
      expect(result.missingDocs.map((d) => d.key)).toContain('sf_passport_submitted')
      expect(result.targetStage).toBe('applicant')
    }
  })

  it('blocks Enrolled when documents are missing', () => {
    const lead = sfLead({ sf_civil_id_submitted: false } as Partial<Lead>)
    const result = checkStageTransition({ lead, newStage: 'enrolled', amountPaid: 550 })
    expect(result.kind).toBe('sf_documents')
  })

  it('still requires documents for payment-exempt leads', () => {
    const lead = sfLead({ payment_exempt: true, sf_declaration_submitted: false } as Partial<Lead>)
    const result = checkStageTransition({ lead, newStage: 'applicant', amountPaid: 0 })
    expect(result.kind).toBe('sf_documents')
  })

  it('checks payment before documents when both are missing', () => {
    const lead = sfLead({ sf_passport_submitted: false } as Partial<Lead>)
    const result = checkStageTransition({ lead, newStage: 'applicant', amountPaid: 0 })
    expect(result.kind).toBe('sf_payment')
  })

  it('allows Applicant when tuition paid and every document submitted', () => {
    const lead = sfLead()
    const result = checkStageTransition({ lead, newStage: 'applicant', amountPaid: 550 })
    expect(result.kind).toBe('allow')
  })

  it('does not apply the SF document gate to PUC leads', () => {
    const lead = sfLead({ funding_type: 'puc' } as Partial<Lead>)
    const result = checkStageTransition({ lead, newStage: 'applicant', amountPaid: 0 })
    expect(result.kind).not.toBe('sf_documents')
  })
})

describe('getMissingSfDocuments', () => {
  it('returns an empty list when all documents are submitted', () => {
    expect(getMissingSfDocuments(sfLead())).toEqual([])
  })

  it('lists every unsubmitted document', () => {
    const lead = sfLead({ sf_passport_submitted: false, sf_civil_id_submitted: false } as Partial<Lead>)
    const missing = getMissingSfDocuments(lead).map((d) => d.key)
    expect(missing).toEqual(['sf_passport_submitted', 'sf_civil_id_submitted'])
  })
})
