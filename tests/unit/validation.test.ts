import { describe, it, expect } from 'vitest';
import {
  saveAttendanceSchema,
  attendanceRecordItemSchema,
  createClassroomSchema,
  loginSchema,
} from '@/lib/validation/schemas';
import { AttendanceStatus } from '@prisma/client';

describe('Zod Validation Schemas', () => {
  it('validates correct attendance status values', () => {
    const valid = attendanceRecordItemSchema.safeParse({
      studentId: 'stu-1',
      status: AttendanceStatus.PRESENT,
      remarks: 'Normal attendance',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid attendance status values', () => {
    const invalid = attendanceRecordItemSchema.safeParse({
      studentId: 'stu-1',
      status: 'HALFDAY', // Invalid enum
    });
    expect(invalid.success).toBe(false);
  });

  it('validates complete attendance submission payload', () => {
    const valid = saveAttendanceSchema.safeParse({
      classId: 'cls-1',
      subjectId: 'sub-1',
      attendanceDate: '2026-03-01',
      records: [
        { studentId: 's1', status: AttendanceStatus.PRESENT },
        { studentId: 's2', status: AttendanceStatus.ABSENT, remarks: 'Sick' },
      ],
    });
    expect(valid.success).toBe(true);
  });

  it('rejects malformed date formats in attendance payload', () => {
    const invalid = saveAttendanceSchema.safeParse({
      classId: 'cls-1',
      subjectId: 'sub-1',
      attendanceDate: '01/03/2026', // Not YYYY-MM-DD
      records: [{ studentId: 's1', status: AttendanceStatus.PRESENT }],
    });
    expect(invalid.success).toBe(false);
  });

  it('validates classroom academic year format (YYYY-YYYY)', () => {
    const valid = createClassroomSchema.safeParse({
      name: 'CSE 4th Sem',
      section: 'A',
      academicYear: '2025-2026',
    });
    expect(valid.success).toBe(true);

    const invalid = createClassroomSchema.safeParse({
      name: 'CSE 4th Sem',
      section: 'A',
      academicYear: '25-26', // Invalid format
    });
    expect(invalid.success).toBe(false);
  });

  it('validates email format in login schema', () => {
    const invalid = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalid.success).toBe(false);
  });
});

