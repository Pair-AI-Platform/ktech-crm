import { describe, it, expect } from 'vitest'
import { parseCSV, createHeaderMap, parseLeadFromCSV, exportLeadsToCSV, generateCSVTemplate } from '@/lib/csv-utils'

describe('parseCSV', () => {
  it('parses simple CSV', () => {
    const csv = 'Name,Age\nAhmed,25\nSara,30'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(['Name', 'Age'])
    expect(rows[1]).toEqual(['Ahmed', '25'])
  })

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Notes\nAhmed,"Hello, world"'
    const rows = parseCSV(csv)
    expect(rows[1][1]).toBe('Hello, world')
  })

  it('handles escaped quotes within quoted fields', () => {
    const csv = 'Name,Notes\nAhmed,"He said ""hello"""'
    const rows = parseCSV(csv)
    expect(rows[1][1]).toBe('He said "hello"')
  })

  it('skips empty lines', () => {
    const csv = 'Name\n\nAhmed\n\n'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(2)
  })

  it('handles Windows line endings', () => {
    const csv = 'Name\r\nAhmed\r\nSara'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(3)
  })
})

describe('createHeaderMap', () => {
  it('maps standard column names', () => {
    const map = createHeaderMap(['First Name', 'Last Name', 'Phone'])
    expect(map.get('first_name')).toBe(0)
    expect(map.get('last_name')).toBe(1)
    expect(map.get('phone')).toBe(2)
  })

  it('maps common variations', () => {
    const map = createHeaderMap(['FirstName', 'Mobile', 'DOB', 'Email'])
    expect(map.get('first_name')).toBe(0)
    expect(map.get('phone')).toBe(1)
    expect(map.get('date_of_birth')).toBe(2)
    expect(map.get('email')).toBe(3)
  })

  it('handles case insensitivity', () => {
    const map = createHeaderMap(['FIRST_NAME', 'PHONE'])
    expect(map.get('first_name')).toBe(0)
    expect(map.get('phone')).toBe(1)
  })

  it('ignores unknown headers', () => {
    const map = createHeaderMap(['First Name', 'Unknown Column'])
    expect(map.size).toBe(1)
  })
})

describe('parseLeadFromCSV', () => {
  const headers = createHeaderMap(['First Name', 'Last Name', 'Phone', 'Email', 'Source', 'Funding Type'])

  it('parses a valid lead', () => {
    const row = ['Ahmed', 'Ali', '55512345', 'ahmed@test.com', 'walk_in', 'self_funded']
    const result = parseLeadFromCSV(row, headers)
    expect(result.data).not.toBeNull()
    expect(result.data!.first_name).toBe('Ahmed')
    expect(result.data!.last_name).toBe('Ali')
    expect(result.data!.phone).toBe('55512345')
  })

  it('returns errors for missing required fields', () => {
    const row = ['', '', '', '', '', '']
    const result = parseLeadFromCSV(row, headers)
    expect(result.data).toBeNull()
    expect(result.errors).toContain('First name is required')
    expect(result.errors).toContain('Last name is required')
    expect(result.errors).toContain('Phone is required')
  })

  it('validates phone length', () => {
    const row = ['Ahmed', 'Ali', '123', '', '', '']
    const result = parseLeadFromCSV(row, headers)
    expect(result.data).toBeNull()
    expect(result.errors).toContain('Phone must be 8 digits')
  })

  it('strips non-numeric chars from phone', () => {
    const row = ['Ahmed', 'Ali', '+965-5551-2345', '', '', '']
    const result = parseLeadFromCSV(row, headers)
    // Phone becomes 96555512345 which is 11 digits, so it fails the 8-digit check
    expect(result.data).toBeNull()
  })

  it('defaults invalid source to walk_in', () => {
    const row = ['Ahmed', 'Ali', '55512345', '', 'invalid_source', '']
    const result = parseLeadFromCSV(row, headers)
    expect(result.data!.source).toBe('walk_in')
  })

  it('defaults invalid funding type to self_funded', () => {
    const row = ['Ahmed', 'Ali', '55512345', '', '', 'invalid']
    const result = parseLeadFromCSV(row, headers)
    expect(result.data!.funding_type).toBe('self_funded')
  })
})

describe('exportLeadsToCSV', () => {
  it('generates CSV with headers and data', () => {
    const leads = [{
      first_name: 'Ahmed',
      last_name: 'Ali',
      phone: '55512345',
    }] as any[]
    const csv = exportLeadsToCSV(leads)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('First Name')
    expect(lines[1]).toContain('Ahmed')
  })

  it('handles boolean values as Yes/No', () => {
    const leads = [{ is_kuwaiti: true, has_bank_account: false }] as any[]
    const csv = exportLeadsToCSV(leads)
    expect(csv).toContain('Yes')
    expect(csv).toContain('No')
  })

  it('escapes commas and quotes in values', () => {
    const leads = [{ notes: 'Hello, "world"' }] as any[]
    const csv = exportLeadsToCSV(leads)
    expect(csv).toContain('"Hello, ""world"""')
  })
})

describe('generateCSVTemplate', () => {
  it('returns a string with headers and example row', () => {
    const template = generateCSVTemplate()
    const lines = template.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('First Name')
    expect(lines[1]).toContain('Laila')
  })
})
