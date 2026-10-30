import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role, AttendanceStatus } from '@prisma/client';
import { parseDateOnly } from '@/lib/utils/date';
import { calculateAttendancePercentage } from '@/lib/attendance/calculations';
import { generateCsv } from '@/lib/reports/csv';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== Role.ADMIN && session.role !== Role.TEACHER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const thresholdParam = searchParams.get('threshold');
  const threshold = thresholdParam !== null && thresholdParam !== '' ? parseFloat(thresholdParam) : null;

  if (!classId) {
    return NextResponse.json({ error: 'Class ID is required for export' }, { status: 400 });
  }

  // Teacher authorization check
  if (session.role === Role.TEACHER) {
    if (!session.teacherProfileId) {
      return NextResponse.json({ error: 'Teacher profile missing' }, { status: 403 });
    }
    const assignment = await prisma.teachingAssignment.findFirst({
      where: {
        teacherId: session.teacherProfileId,
        classId,
        ...(subjectId ? { subjectId } : {}),
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to export data for this class' },
        { status: 403 }
      );
    }
  }

  const sessionWhere: Record<string, unknown> = { classId };
  if (subjectId) sessionWhere.subjectId = subjectId;

  if (startDateStr || endDateStr) {
    const dateRange: Record<string, Date> = {};
    if (startDateStr) dateRange.gte = parseDateOnly(startDateStr);
    if (endDateStr) dateRange.lte = parseDateOnly(endDateStr);
    sessionWhere.attendanceDate = dateRange;
  }

  const [students, records, classroom] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { classId, user: { isActive: true } },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { rollNumber: 'asc' },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        session: sessionWhere,
      },
      select: {
        studentId: true,
        status: true,
      },
    }),
    prisma.classroom.findUnique({
      where: { id: classId },
    }),
  ]);

  const studentMap = new Map<string, { present: number; absent: number; late: number; excused: number }>();
  for (const s of students) {
    studentMap.set(s.id, { present: 0, absent: 0, late: 0, excused: 0 });
  }

  for (const r of records) {
    const counts = studentMap.get(r.studentId);
    if (counts) {
      if (r.status === AttendanceStatus.PRESENT) counts.present++;
      else if (r.status === AttendanceStatus.ABSENT) counts.absent++;
      else if (r.status === AttendanceStatus.LATE) counts.late++;
      else if (r.status === AttendanceStatus.EXCUSED) counts.excused++;
    }
  }

  const headers = [
    'Roll Number',
    'Student Name',
    'Email Address',
    'Class',
    'Section',
    'Present',
    'Absent',
    'Late',
    'Excused',
    'Total Sessions',
    'Eligible Sessions',
    'Attended Sessions',
    'Attendance Percentage',
    'Low Attendance Warning',
  ];

  const rows: (string | number)[][] = [];

  for (const s of students) {
    const counts = studentMap.get(s.id)!;
    const calc = calculateAttendancePercentage(
      counts.present,
      counts.absent,
      counts.late,
      counts.excused
    );

    const isLow = threshold !== null && calc.percentage !== null && calc.percentage < threshold;

    if (threshold !== null && !isLow) {
      continue;
    }

    rows.push([
      s.rollNumber,
      s.user.fullName,
      s.user.email,
      classroom?.name || '',
      classroom?.section || '',
      counts.present,
      counts.absent,
      counts.late,
      counts.excused,
      calc.total,
      calc.eligibleSessions,
      calc.attendedSessions,
      calc.percentageFormatted,
      isLow ? 'YES (<' + threshold + '%)' : 'NO',
    ]);
  }

  const csvContent = generateCsv(headers, rows);
  const classNameClean = (classroom?.name || 'Class').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Attendance_Report_${classNameClean}_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

