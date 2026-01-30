import { describe, it, expect } from 'vitest'
import { formatKuwaitPhone, replaceTemplateVariables } from '@/lib/sms/provider'

describe('formatKuwaitPhone', () => {
  it('should add +965 prefix to 8-digit local numbers', () => {
    expect(formatKuwaitPhone('98765432')).toBe('+96598765432')
  })

  it('should add + to numbers already starting with 965', () => {
    expect(formatKuwaitPhone('96598765432')).toBe('+96598765432')
  })

  it('should keep + prefix if already present', () => {
    expect(formatKuwaitPhone('+96598765432')).toBe('+96598765432')
  })

  it('should strip non-digit characters', () => {
    expect(formatKuwaitPhone('9876-5432')).toBe('+96598765432')
  })

  it('should handle spaces in numbers', () => {
    expect(formatKuwaitPhone('9876 5432')).toBe('+96598765432')
  })
})

describe('replaceTemplateVariables', () => {
  it('should replace single variable', () => {
    const result = replaceTemplateVariables('Hello {{name}}', { name: 'Ahmed' })
    expect(result).toBe('Hello Ahmed')
  })

  it('should replace multiple variables', () => {
    const template = 'Hi {{first_name}}, your appointment is on {{date}} at {{time}}'
    const result = replaceTemplateVariables(template, {
      first_name: 'Sara',
      date: 'Monday',
      time: '10:00',
    })
    expect(result).toBe('Hi Sara, your appointment is on Monday at 10:00')
  })

  it('should replace duplicate variables', () => {
    const result = replaceTemplateVariables('{{name}} and {{name}}', { name: 'Test' })
    expect(result).toBe('Test and Test')
  })

  it('should replace with empty string for undefined values', () => {
    const result = replaceTemplateVariables('Hello {{name}}', { name: '' })
    expect(result).toBe('Hello ')
  })

  it('should leave unreferenced placeholders unchanged', () => {
    const result = replaceTemplateVariables('Hello {{name}} {{unknown}}', { name: 'Test' })
    expect(result).toBe('Hello Test {{unknown}}')
  })
})
