import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role, AttendanceStatus } from '@prisma/client';
import { parseDateOnly } from '@/lib/utils/date';
import { calculateAttendancePercentage } from '@/lib/attendance/calculations';

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
  const threshold = thresholdParam !== null ? parseFloat(thresholdParam) : null;

  if (!classId) {
    return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
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
        { error: 'You are not assigned to view reports for this class' },
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

  // Fetch all students in the class
  const students = await prisma.studentProfile.findMany({
    where: { classId, user: { isActive: true } },
    include: {
      user: { select: { fullName: true, email: true } },
      classroom: true,
    },
    orderBy: { rollNumber: 'asc' },
  });

  // Fetch all matching records
  const records = await prisma.attendanceRecord.findMany({
    where: {
      session: sessionWhere,
    },
    select: {
      studentId: true,
      status: true,
    },
  });

  // Group by student
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

  let studentReports = students.map((s) => {
    const counts = studentMap.get(s.id)!;
    const calc = calculateAttendancePercentage(
      counts.present,
      counts.absent,
      counts.late,
      counts.excused
    );

    return {
      studentId: s.id,
      rollNumber: s.rollNumber,
      fullName: s.user.fullName,
      email: s.user.email,
      className: `${s.classroom.name} (${s.classroom.section})`,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      totalSessions: calc.total,
      attendedSessions: calc.attendedSessions,
      eligibleSessions: calc.eligibleSessions,
      percentage: calc.percentage,
      percentageFormatted: calc.percentageFormatted,
      isLowAttendance: threshold !== null && calc.percentage !== null && calc.percentage < threshold,
    };
  });

  if (threshold !== null) {
    studentReports = studentReports.filter((s) => s.isLowAttendance);
  }

  return NextResponse.json({
    studentReports,
    totalStudents: students.length,
    filteredCount: studentReports.length,
  });
}

