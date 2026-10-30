import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { createSubjectSchema } from '@/lib/validation/schemas';
import { createAuditLog } from '@/lib/audit/logger';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { code: 'asc' },
  });

  return NextResponse.json({ subjects });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createSubjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, code } = parsed.data;

    const existing = await prisma.subject.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Subject code already in use' }, { status: 409 });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
      },
    });

    await createAuditLog({
      actorId: session.userId,
      action: 'SUBJECT_CREATED',
      entityType: 'Subject',
      entityId: subject.id,
      newValues: { name, code: subject.code },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

