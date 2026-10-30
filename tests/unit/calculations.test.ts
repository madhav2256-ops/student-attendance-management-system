import { describe, it, expect } from 'vitest';
import {
  calculateAttendancePercentage,
  computeStatsFromRecords,
} from '@/lib/attendance/calculations';
import { AttendanceStatus } from '@prisma/client';

describe('Attendance Percentage Calculation Engine', () => {
  it('correctly calculates percentage: ((Present + Late) / (Present + Absent + Late)) * 100', () => {
    // 8 Present, 1 Late, 1 Absent, 0 Excused -> 9/10 = 90%
    const result = calculateAttendancePercentage(8, 1, 1, 0);
    expect(result.percentage).toBe(90.0);
    expect(result.percentageFormatted).toBe('90.0%');
    expect(result.attendedSessions).toBe(9);
    expect(result.eligibleSessions).toBe(10);
    expect(result.total).toBe(10);
  });

  it('strictly excludes EXCUSED sessions from the denominator', () => {
    // 7 Present, 1 Late, 2 Absent, 5 Excused
    // Eligible: 7 + 1 + 2 = 10 (Excused 5 are NOT added to denominator!)
    // Attended: 7 + 1 = 8
    // Result: 8 / 10 = 80%
    const result = calculateAttendancePercentage(7, 2, 1, 5);
    expect(result.eligibleSessions).toBe(10);
    expect(result.total).toBe(15);
    expect(result.attendedSessions).toBe(8);
    expect(result.percentage).toBe(80.0);
    expect(result.percentageFormatted).toBe('80.0%');
  });

  it('safely handles zero eligible sessions and returns null / "N/A" instead of dividing by zero', () => {
    // 0 Present, 0 Absent, 0 Late, 0 Excused
    const result = calculateAttendancePercentage(0, 0, 0, 0);
    expect(result.eligibleSessions).toBe(0);
    expect(result.percentage).toBeNull();
    expect(result.percentageFormatted).toBe('N/A');
  });

  it('safely handles only excused sessions where eligible count is zero', () => {
    // 0 Present, 0 Absent, 0 Late, 4 Excused
    const result = calculateAttendancePercentage(0, 0, 0, 4);
    expect(result.eligibleSessions).toBe(0);
    expect(result.total).toBe(4);
    expect(result.percentage).toBeNull();
    expect(result.percentageFormatted).toBe('N/A');
  });

  it('computes stats accurately from record array', () => {
    const records = [
      { status: AttendanceStatus.PRESENT },
      { status: AttendanceStatus.PRESENT },
      { status: AttendanceStatus.LATE },
      { status: AttendanceStatus.ABSENT },
      { status: AttendanceStatus.EXCUSED },
    ];

    const result = computeStatsFromRecords(records);
    // 2 Present, 1 Late, 1 Absent, 1 Excused
    // Attended: 3
    // Eligible: 4
    // 3/4 = 75%
    expect(result.present).toBe(2);
    expect(result.late).toBe(1);
    expect(result.absent).toBe(1);
    expect(result.excused).toBe(1);
    expect(result.percentage).toBe(75.0);
  });
});

