import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { createTeacherSchema } from '@/lib/validation/schemas';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const teachers = await prisma.teacherProfile.findMany({
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
      assignments: {
        include: {
          classroom: true,
          subject: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ teachers });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, password, employeeCode } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    if (employeeCode) {
      const existingCode = await prisma.teacherProfile.findUnique({ where: { employeeCode } });
      if (existingCode) {
        return NextResponse.json({ error: 'Employee code already in use' }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          passwordHash,
          role: Role.TEACHER,
          isActive: true,
        },
      });

      return tx.teacherProfile.create({
        data: {
          userId: user.id,
          employeeCode: employeeCode || null,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true, isActive: true } },
        },
      });
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'TEACHER_CREATED',
      entityType: 'TeacherProfile',
      entityId: teacher.id,
      newValues: {
        email,
        fullName,
        employeeCode,
      },
    });

    return NextResponse.json({ teacher }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

