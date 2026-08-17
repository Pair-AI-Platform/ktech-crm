import type { ExportData } from './pdf-generator'

/**
 * Generates a standard CSV string with a header row and data rows.
 * CSV export is Edge Runtime compatible (no Node.js dependencies).
 */
export function generateCSV(data: ExportData): string {
  const header = data.columns.map((col) => escapeCsvField(col.label)).join(',')

  const rows = data.rows.map((row) =>
    data.columns
      .map((col) => {
        const value = row[col.key]
        if (value === null || value === undefined) return ''
        return escapeCsvField(String(value))
      })
      .join(',')
  )

  return [header, ...rows].join('\n')
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
