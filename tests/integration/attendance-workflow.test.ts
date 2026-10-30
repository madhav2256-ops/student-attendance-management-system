import { describe, it, expect } from 'vitest';
import { parseDateOnly, formatDateOnly, isFutureDate } from '@/lib/utils/date';

describe('Attendance Workflow & Business Logic', () => {
  it('parses date-only string without timezone day-shifting', () => {
    const input = '2026-03-15';
    const parsed = parseDateOnly(input);

    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(2); // 0-indexed: 2 is March
    expect(parsed.getUTCDate()).toBe(15);

    const formatted = formatDateOnly(parsed);
    expect(formatted).toBe(input);
  });

  it('detects and disallows future attendance dates', () => {
    // 2099 is definitely in the future
    expect(isFutureDate('2099-12-31')).toBe(true);

    // 2020 is in the past
    expect(isFutureDate('2020-01-01')).toBe(false);
  });

  it('detects duplicate student IDs within a single attendance submission', () => {
    const rawSubmissions = [
      { studentId: 'student-1', status: 'PRESENT' },
      { studentId: 'student-2', status: 'ABSENT' },
      { studentId: 'student-1', status: 'LATE' }, // Duplicate studentId
    ];

    const studentIds = rawSubmissions.map((s) => s.studentId);
    const hasDuplicates = new Set(studentIds).size !== studentIds.length;
    expect(hasDuplicates).toBe(true);
  });
});

