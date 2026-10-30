import { describe, it, expect } from 'vitest';
import { sanitizeCsvField, generateCsv } from '@/lib/reports/csv';

describe('CSV Sanitization and Security (CWE-1236)', () => {
  it('neutralizes leading "=" to prevent spreadsheet formula injection', () => {
    const malicious = '=1+2';
    const sanitized = sanitizeCsvField(malicious);
    expect(sanitized).toBe("\"'=1+2\"");
  });

  it('neutralizes leading "+", "-", and "@"', () => {
    expect(sanitizeCsvField('+SUM(A1:A10)')).toBe("\"'+SUM(A1:A10)\"");
    expect(sanitizeCsvField('-CMD|calc')).toBe("\"'-CMD|calc\"");
    expect(sanitizeCsvField('@IMPORT')).toBe("\"'@IMPORT\"");
  });

  it('properly escapes internal double quotes', () => {
    const textWithQuotes = 'Aarav "The Scholar" Mehta';
    const sanitized = sanitizeCsvField(textWithQuotes);
    expect(sanitized).toBe('"Aarav ""The Scholar"" Mehta"');
  });

  it('generates well-formed CSV rows and headers', () => {
    const headers = ['Roll', 'Name', 'Status'];
    const rows = [
      ['2025-01', 'Aarav', 'PRESENT'],
      ['2025-02', 'Diya, Sen', 'ABSENT'],
    ];

    const csv = generateCsv(headers, rows);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('"Roll","Name","Status"');
    expect(lines[1]).toBe('"2025-01","Aarav","PRESENT"');
    expect(lines[2]).toBe('"2025-02","Diya, Sen","ABSENT"');
  });
});

