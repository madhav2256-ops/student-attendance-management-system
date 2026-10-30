import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { parseDateOnly } from '@/lib/utils/date';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  const whereClause: Record<string, unknown> = {};

  if (classId) whereClause.classId = classId;
  if (subjectId) whereClause.subjectId = subjectId;

  if (startDateStr || endDateStr) {
    const dateRange: Record<string, Date> = {};
    if (startDateStr) dateRange.gte = parseDateOnly(startDateStr);
    if (endDateStr) dateRange.lte = parseDateOnly(endDateStr);
    whereClause.attendanceDate = dateRange;
  }

  // Role filtering
  if (session.role === Role.TEACHER) {
    if (!session.teacherProfileId) {
      return NextResponse.json({ error: 'Teacher profile missing' }, { status: 403 });
    }
    // Only fetch sessions for classes the teacher is assigned to
    const teacherAssignments = await prisma.teachingAssignment.findMany({
      where: { teacherId: session.teacherProfileId },
      select: { classId: true, subjectId: true },
    });

    if (teacherAssignments.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    whereClause.OR = teacherAssignments.map((a) => ({
      classId: a.classId,
      subjectId: a.subjectId,
    }));
  } else if (session.role === Role.STUDENT) {
    return NextResponse.json({ error: 'Students should use /api/reports/student endpoint' }, { status: 403 });
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: whereClause,
    include: {
      classroom: true,
      subject: true,
      markedBy: { select: { fullName: true, email: true } },
      records: {
        select: {
          id: true,
          status: true,
          student: {
            select: {
              rollNumber: true,
              user: { select: { fullName: true } },
            },
          },
        },
      },
    },
    orderBy: { attendanceDate: 'desc' },
  });

  return NextResponse.json({ sessions });
}

