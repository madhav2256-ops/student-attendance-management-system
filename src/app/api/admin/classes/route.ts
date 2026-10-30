import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { createClassroomSchema } from '@/lib/validation/schemas';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const classrooms = await prisma.classroom.findMany({
    include: {
      _count: {
        select: {
          students: true,
          assignments: true,
          attendanceSessions: true,
        },
      },
      assignments: {
        include: {
          teacher: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
          subject: true,
        },
      },
    },
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }, { section: 'asc' }],
  });

  return NextResponse.json({ classrooms });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createClassroomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, section, academicYear } = parsed.data;

    // Check unique composite
    const existing = await prisma.classroom.findUnique({
      where: {
        name_section_academicYear: {
          name,
          section,
          academicYear,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Classroom with this name, section, and academic year already exists' },
        { status: 409 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        section,
        academicYear,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'CLASSROOM_CREATED',
      entityType: 'Classroom',
      entityId: classroom.id,
      newValues: { name, section, academicYear },
    });

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error('Error creating classroom:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

