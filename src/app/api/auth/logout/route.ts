import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getSession } from '@/lib/auth/session';
import { createAuditLog } from '@/lib/audit/logger';

export async function POST() {
  const session = await getSession();
  if (session) {
    await createAuditLog({
      actorId: session.userId,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: session.userId,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

