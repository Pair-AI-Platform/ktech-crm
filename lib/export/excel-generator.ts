import type { ExportData } from './pdf-generator'

/**
 * Generates a standard CSV string with a header row and data rows.
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

/**
 * Generates an Excel-compatible SpreadsheetML (XML) document.
 * This format opens natively in Excel without requiring any additional dependencies.
 */
export function generateExcelXML(data: ExportData): string {
  const headerCells = data.columns
    .map(
      (col) =>
        `      <Cell><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`
    )
    .join('\n')

  const dataRows = data.rows
    .map((row) => {
      const cells = data.columns
        .map((col) => {
          const value = row[col.key]
          if (value === null || value === undefined) {
            return `      <Cell><Data ss:Type="String"></Data></Cell>`
          }
          if (typeof value === 'number') {
            return `      <Cell><Data ss:Type="Number">${value}</Data></Cell>`
          }
          return `      <Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`
        })
        .join('\n')

      return `    <Row>\n${cells}\n    </Row>`
    })
    .join('\n')

  const title = escapeXml(data.title)

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${title}</Title>
    <Author>KTECH CRM</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF" ss:Bold="1"/>
    </Style>
    <Style ss:ID="Default">
      <Font ss:Size="10"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${title.substring(0, 31)}">
    <Table>
${data.columns.map((col) => `      <Column ss:Width="${col.width || 120}"/>`).join('\n')}
    <Row ss:StyleID="Header">
${headerCells}
    </Row>
${dataRows}
    </Table>
  </Worksheet>
</Workbook>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
