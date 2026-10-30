/**
 * CSV Generator with security against Spreadsheet Formula Injection (CWE-1236)
 */

export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Check for dangerous formula starters: =, +, -, @, \t, \r
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    // Prefix with single quote to force spreadsheet software to treat it as text
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

export function generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

