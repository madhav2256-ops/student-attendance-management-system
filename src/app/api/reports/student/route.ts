import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role, AttendanceStatus } from '@prisma/client';
import { parseDateOnly } from '@/lib/utils/date';
import { calculateAttendancePercentage } from '@/lib/attendance/calculations';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let studentId = searchParams.get('studentId');
  const subjectId = searchParams.get('subjectId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  // Strict role check:
  // If the user is a STUDENT, they can ONLY access their own profile ID
  if (session.role === Role.STUDENT) {
    if (!session.studentProfileId) {
      return NextResponse.json({ error: 'Student profile missing' }, { status: 403 });
    }
    // Override any studentId parameter with authenticated session studentProfileId
    studentId = session.studentProfileId;
  } else {
    // Admin or Teacher
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
  }

  // Load student profile
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true, email: true } },
      classroom: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Build filter for sessions
  const sessionWhere: Record<string, unknown> = {};
  if (subjectId) sessionWhere.subjectId = subjectId;

  if (startDateStr || endDateStr) {
    const dateRange: Record<string, Date> = {};
    if (startDateStr) dateRange.gte = parseDateOnly(startDateStr);
    if (endDateStr) dateRange.lte = parseDateOnly(endDateStr);
    sessionWhere.attendanceDate = dateRange;
  }

  // Fetch all attendance records for this student
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      session: sessionWhere,
    },
    include: {
      session: {
        include: {
          subject: true,
          classroom: true,
          markedBy: { select: { fullName: true } },
        },
      },
    },
    orderBy: {
      session: { attendanceDate: 'desc' },
    },
  });

  // Calculate overall statistics
  let overallPresent = 0;
  let overallAbsent = 0;
  let overallLate = 0;
  let overallExcused = 0;

  // Group by subject
  const subjectMap = new Map<
    string,
    {
      subjectName: string;
      subjectCode: string;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }
  >();

  for (const r of records) {
    if (r.status === AttendanceStatus.PRESENT) overallPresent++;
    else if (r.status === AttendanceStatus.ABSENT) overallAbsent++;
    else if (r.status === AttendanceStatus.LATE) overallLate++;
    else if (r.status === AttendanceStatus.EXCUSED) overallExcused++;

    const sub = r.session.subject;
    if (!subjectMap.has(sub.id)) {
      subjectMap.set(sub.id, {
        subjectName: sub.name,
        subjectCode: sub.code,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    const subCounts = subjectMap.get(sub.id)!;
    if (r.status === AttendanceStatus.PRESENT) subCounts.present++;
    else if (r.status === AttendanceStatus.ABSENT) subCounts.absent++;
    else if (r.status === AttendanceStatus.LATE) subCounts.late++;
    else if (r.status === AttendanceStatus.EXCUSED) subCounts.excused++;
  }

  const overallStats = calculateAttendancePercentage(
    overallPresent,
    overallAbsent,
    overallLate,
    overallExcused
  );

  const subjectBreakdown = Array.from(subjectMap.entries()).map(([id, data]) => {
    const calc = calculateAttendancePercentage(
      data.present,
      data.absent,
      data.late,
      data.excused
    );
    return {
      subjectId: id,
      subjectName: data.subjectName,
      subjectCode: data.subjectCode,
      ...calc,
    };
  });

  const formattedHistory = records.map((r) => ({
    recordId: r.id,
    date: r.session.attendanceDate.toISOString().split('T')[0],
    subjectName: r.session.subject.name,
    subjectCode: r.session.subject.code,
    status: r.status,
    remarks: r.remarks,
    markedBy: r.session.markedBy.fullName,
    markedAt: r.markedAt.toISOString(),
  }));

  return NextResponse.json({
    student: {
      id: student.id,
      fullName: student.user.fullName,
      email: student.user.email,
      rollNumber: student.rollNumber,
      classroom: `${student.classroom.name} (${student.classroom.section})`,
      academicYear: student.classroom.academicYear,
    },
    overallStats,
    subjectBreakdown,
    history: formattedHistory,
  });
}

