/**
 * CSV Export and Print Utilities
 */

/**
 * Flatten a nested object using dot notation for keys.
 * e.g. { a: { b: 1 } } => { "a.b": 1 }
 */
function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      Object.assign(
        result,
        flattenObject(value as Record<string, unknown>, fullKey),
      );
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

/**
 * Escape a cell value for CSV output.
 * Wraps the value in double quotes if it contains a comma, double quote,
 * or newline. Any internal double quotes are doubled per RFC 4180.
 */
function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = value instanceof Date ? value.toISOString() : String(value);

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Export an array of objects to a CSV file and trigger a browser download.
 *
 * - Nested objects are flattened with dot-notation keys.
 * - Cell values containing commas, quotes, or newlines are properly escaped.
 * - Column headers are derived from the union of all keys across every row.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (data.length === 0) return;

  // Flatten all rows and collect the full set of headers
  const flatRows = data.map((row) => flattenObject(row));
  const headerSet = new Set<string>();
  for (const row of flatRows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }
  const headers = Array.from(headerSet);

  // Build CSV string
  const lines: string[] = [];
  lines.push(headers.map(escapeCSVCell).join(','));

  for (const row of flatRows) {
    const cells = headers.map((header) => escapeCSVCell(row[header]));
    lines.push(cells.join(','));
  }

  const csvContent = lines.join('\n');

  // Trigger download via Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger the browser's native print dialog for the current page.
 */
export function exportToPrint(): void {
  window.print();
}
