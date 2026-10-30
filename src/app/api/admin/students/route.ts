import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { createStudentSchema, updateStudentSchema } from '@/lib/validation/schemas';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== Role.ADMIN && session.role !== Role.TEACHER)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const search = searchParams.get('search')?.trim();

  const whereClause: Record<string, unknown> = {};
  if (classId) {
    whereClause.classId = classId;
  }
  if (search) {
    whereClause.OR = [
      { rollNumber: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const students = await prisma.studentProfile.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          createdAt: true,
        },
      },
      classroom: {
        select: {
          id: true,
          name: true,
          section: true,
          academicYear: true,
        },
      },
    },
    orderBy: { rollNumber: 'asc' },
  });

  return NextResponse.json({ students });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, password, rollNumber, classId } = parsed.data;

    // Check unique email and rollNumber
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return NextResponse.json({ error: 'A student with this roll number already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create in a transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          rollNumber,
          classId,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, isActive: true } },
          classroom: true,
        },
      });

      return profile;
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'STUDENT_CREATED',
      entityType: 'StudentProfile',
      entityId: newStudent.id,
      newValues: {
        studentId: newStudent.id,
        email,
        fullName,
        rollNumber,
        classId,
      },
    });

    return NextResponse.json({ student: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Student Profile ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { fullName, email, rollNumber, classId, isActive } = parsed.data;

    // Check unique rollNumber if changed
    if (rollNumber !== existing.rollNumber) {
      const rollCheck = await prisma.studentProfile.findUnique({ where: { rollNumber } });
      if (rollCheck && rollCheck.id !== id) {
        return NextResponse.json({ error: 'Roll number already in use' }, { status: 409 });
      }
    }

    // Check unique email if changed
    if (email.toLowerCase() !== existing.user.email.toLowerCase()) {
      const emailCheck = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (emailCheck && emailCheck.id !== existing.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          fullName,
          email: email.toLowerCase(),
          isActive,
        },
      });

      return tx.studentProfile.update({
        where: { id },
        data: {
          rollNumber,
          classId,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, isActive: true } },
          classroom: true,
        },
      });
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'STUDENT_UPDATED',
      entityType: 'StudentProfile',
      entityId: id,
      previousValues: {
        fullName: existing.user.fullName,
        email: existing.user.email,
        rollNumber: existing.rollNumber,
        classId: existing.classId,
        isActive: existing.user.isActive,
      },
      newValues: {
        fullName,
        email,
        rollNumber,
        classId,
        isActive,
      },
    });

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

