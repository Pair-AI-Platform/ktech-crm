export interface ExportData {
  title: string
  subtitle?: string
  columns: { key: string; label: string; width?: number }[]
  rows: Record<string, string | number | null>[]
  metadata?: Record<string, string>
}

/**
 * Generates a printable HTML document that can be opened in a browser
 * and printed to PDF via the browser's Print dialog.
 */
export function generatePDFHTML(data: ExportData): string {
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const metadataRows = data.metadata
    ? Object.entries(data.metadata)
        .map(
          ([key, value]) =>
            `<div class="meta-item"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</div>`
        )
        .join('')
    : ''

  const theadCells = data.columns
    .map((col) => {
      const style = col.width ? ` style="width:${col.width}px"` : ''
      return `<th${style}>${escapeHtml(col.label)}</th>`
    })
    .join('')

  const tbodyRows = data.rows
    .map((row) => {
      const cells = data.columns
        .map((col) => {
          const value = row[col.key]
          return `<td>${value !== null && value !== undefined ? escapeHtml(String(value)) : ''}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} - KTECH CRM</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      padding: 40px;
      font-size: 12px;
      line-height: 1.4;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #0f172a;
    }

    .brand h1 {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .report-info {
      text-align: right;
    }

    .report-info h2 {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
    }

    .report-info .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .meta-item {
      font-size: 11px;
      color: #475569;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    th {
      background: #0f172a;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 20px; }

      .header { break-after: avoid; }

      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }

      @page {
        size: A4 landscape;
        margin: 15mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>KTECH</h1>
      <p>Customer Relationship Management</p>
    </div>
    <div class="report-info">
      <h2>${escapeHtml(data.title)}</h2>
      ${data.subtitle ? `<div class="subtitle">${escapeHtml(data.subtitle)}</div>` : ''}
    </div>
  </div>

  ${metadataRows ? `<div class="metadata">${metadataRows}</div>` : ''}

  <table>
    <thead>
      <tr>${theadCells}</tr>
    </thead>
    <tbody>
      ${tbodyRows}
    </tbody>
  </table>

  <div class="footer">
    <span>Generated on ${escapeHtml(timestamp)}</span>
    <span>Total Records: ${data.rows.length}</span>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
