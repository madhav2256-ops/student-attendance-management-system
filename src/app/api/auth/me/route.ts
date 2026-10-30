import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      studentProfile: {
        include: {
          classroom: true,
        },
      },
      teacherProfile: {
        include: {
          assignments: {
            include: {
              classroom: true,
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

