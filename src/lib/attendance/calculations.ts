import { AttendanceStatus } from '@prisma/client';

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface AttendanceCalculationResult extends AttendanceCounts {
  eligibleSessions: number; // Present + Absent + Late (Excused excluded)
  attendedSessions: number; // Present + Late
  percentage: number | null; // null represents "N/A"
  percentageFormatted: string; // e.g. "85.7%" or "N/A"
}

/**
 * Calculates academic attendance according to standard institutional policy:
 * Percentage = ((Present + Late) / (Present + Absent + Late)) * 100
 * Note: Excused sessions are excluded from the denominator.
 * If denominator is 0, returns null ("N/A").
 */
export function calculateAttendancePercentage(
  present: number,
  absent: number,
  late: number,
  excused: number
): AttendanceCalculationResult {
  const attendedSessions = present + late;
  const eligibleSessions = present + absent + late;
  const total = present + absent + late + excused;

  if (eligibleSessions === 0) {
    return {
      present,
      absent,
      late,
      excused,
      total,
      eligibleSessions: 0,
      attendedSessions: 0,
      percentage: null,
      percentageFormatted: 'N/A',
    };
  }

  const rawPercentage = (attendedSessions / eligibleSessions) * 100;
  // Round to 1 decimal place
  const rounded = Math.round(rawPercentage * 10) / 10;

  return {
    present,
    absent,
    late,
    excused,
    total,
    eligibleSessions,
    attendedSessions,
    percentage: rounded,
    percentageFormatted: `${rounded.toFixed(1)}%`,
  };
}

export function computeStatsFromRecords(
  records: Array<{ status: AttendanceStatus }>
): AttendanceCalculationResult {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of records) {
    switch (r.status) {
      case AttendanceStatus.PRESENT:
        present++;
        break;
      case AttendanceStatus.ABSENT:
        absent++;
        break;
      case AttendanceStatus.LATE:
        late++;
        break;
      case AttendanceStatus.EXCUSED:
        excused++;
        break;
    }
  }

  return calculateAttendancePercentage(present, absent, late, excused);
}

