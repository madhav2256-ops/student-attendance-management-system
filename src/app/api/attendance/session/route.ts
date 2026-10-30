import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role, SessionStatus } from '@prisma/client';
import { saveAttendanceSchema } from '@/lib/validation/schemas';
import { parseDateOnly, isFutureDate } from '@/lib/utils/date';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== Role.ADMIN && session.role !== Role.TEACHER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const subjectId = searchParams.get('subjectId');
  const dateStr = searchParams.get('date');

  if (!classId || !subjectId || !dateStr) {
    return NextResponse.json(
      { error: 'Missing required query parameters: classId, subjectId, date' },
      { status: 400 }
    );
  }

  // Teacher authorization check: teacher must be assigned to this class and subject
  if (session.role === Role.TEACHER) {
    if (!session.teacherProfileId) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 });
    }
    const assignment = await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_classId_subjectId: {
          teacherId: session.teacherProfileId,
          classId,
          subjectId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to teach this subject in this class' },
        { status: 403 }
      );
    }
  }

  let attendanceDate: Date;
  try {
    attendanceDate = parseDateOnly(dateStr);
  } catch {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  // 1. Check if a session already exists
  const existingSession = await prisma.attendanceSession.findUnique({
    where: {
      classId_subjectId_attendanceDate: {
        classId,
        subjectId,
        attendanceDate,
      },
    },
    include: {
      classroom: true,
      subject: true,
      markedBy: { select: { id: true, fullName: true, email: true } },
      records: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
        },
        orderBy: {
          student: { rollNumber: 'asc' },
        },
      },
    },
  });

  // 2. Fetch all enrolled active students in this class
  const students = await prisma.studentProfile.findMany({
    where: {
      classId,
      user: { isActive: true },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
    orderBy: { rollNumber: 'asc' },
  });

  return NextResponse.json({
    existingSession,
    students,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== Role.ADMIN && session.role !== Role.TEACHER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = saveAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { classId, subjectId, attendanceDate: dateStr, records } = parsed.data;

    // Check future date
    if (isFutureDate(dateStr)) {
      return NextResponse.json(
        { error: 'Cannot record attendance for future dates.' },
        { status: 400 }
      );
    }

    // Teacher authorization check
    if (session.role === Role.TEACHER) {
      if (!session.teacherProfileId) {
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 });
      }
      const assignment = await prisma.teachingAssignment.findUnique({
        where: {
          teacherId_classId_subjectId: {
            teacherId: session.teacherProfileId,
            classId,
            subjectId,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to record attendance for this class and subject.' },
          { status: 403 }
        );
      }
    }

    const attendanceDate = parseDateOnly(dateStr);

    // Prevent duplicate student submissions in payload
    const studentIds = records.map((r) => r.studentId);
    if (new Set(studentIds).size !== studentIds.length) {
      return NextResponse.json(
        { error: 'Duplicate student records found in submission.' },
        { status: 400 }
      );
    }

    // Use Prisma Transaction to ensure atomic save
    const result = await prisma.$transaction(async (tx) => {
      // Find or create session
      let existingSession = await tx.attendanceSession.findUnique({
        where: {
          classId_subjectId_attendanceDate: {
            classId,
            subjectId,
            attendanceDate,
          },
        },
        include: {
          records: true,
        },
      });

      const isUpdate = !!existingSession;
      let previousRecordMap: Record<string, string> = {};

      if (existingSession) {
        previousRecordMap = existingSession.records.reduce((acc, r) => {
          acc[r.studentId] = r.status;
          return acc;
        }, {} as Record<string, string>);

        // Update session markedBy and updatedAt
        existingSession = await tx.attendanceSession.update({
          where: { id: existingSession.id },
          data: {
            markedById: session.userId,
            status: SessionStatus.SUBMITTED,
          },
          include: { records: true },
        });
      } else {
        // Create new session
        existingSession = await tx.attendanceSession.create({
          data: {
            classId,
            subjectId,
            attendanceDate,
            markedById: session.userId,
            status: SessionStatus.SUBMITTED,
          },
          include: { records: true },
        });
      }

      // Upsert attendance records for each student
      for (const rec of records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: existingSession.id,
              studentId: rec.studentId,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks || null,
            markedById: session.userId,
            markedAt: new Date(),
          },
          create: {
            sessionId: existingSession.id,
            studentId: rec.studentId,
            status: rec.status,
            remarks: rec.remarks || null,
            markedById: session.userId,
            markedAt: new Date(),
          },
        });
      }

      return { session: existingSession, isUpdate, previousRecordMap };
    });

    // Audit logging
    await createAuditLog({
      actorId: session.userId,
      action: result.isUpdate ? 'ATTENDANCE_UPDATED' : 'ATTENDANCE_RECORDED',
      entityType: 'AttendanceSession',
      entityId: result.session.id,
      previousValues: result.isUpdate ? { records: result.previousRecordMap } : undefined,
      newValues: {
        classId,
        subjectId,
        date: dateStr,
        recordCount: records.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: result.isUpdate ? 'Attendance updated successfully' : 'Attendance recorded successfully',
      sessionId: result.session.id,
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal server error while saving attendance' }, { status: 500 });
  }
}

