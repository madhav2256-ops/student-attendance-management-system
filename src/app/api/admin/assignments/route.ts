import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { createAssignmentSchema } from '@/lib/validation/schemas';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const assignments = await prisma.teachingAssignment.findMany({
    include: {
      teacher: {
        include: {
          user: { select: { fullName: true, email: true } },
        },
      },
      classroom: true,
      subject: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assignments });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { teacherId, classId, subjectId } = parsed.data;

    // Check duplicate assignment
    const existing = await prisma.teachingAssignment.findUnique({
      where: {
        teacherId_classId_subjectId: {
          teacherId,
          classId,
          subjectId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This teacher is already assigned to this class and subject' },
        { status: 409 }
      );
    }

    const assignment = await prisma.teachingAssignment.create({
      data: {
        teacherId,
        classId,
        subjectId,
      },
      include: {
        teacher: { include: { user: true } },
        classroom: true,
        subject: true,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'TEACHING_ASSIGNMENT_CREATED',
      entityType: 'TeachingAssignment',
      entityId: assignment.id,
      newValues: { teacherId, classId, subjectId },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  const existing = await prisma.teachingAssignment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }

  await prisma.teachingAssignment.delete({ where: { id } });

  await createAuditLog({
    actorId: session.userId,
    action: 'TEACHING_ASSIGNMENT_DELETED',
    entityType: 'TeachingAssignment',
    entityId: id,
    previousValues: {
      teacherId: existing.teacherId,
      classId: existing.classId,
      subjectId: existing.subjectId,
    },
  });

  return NextResponse.json({ success: true });
}

