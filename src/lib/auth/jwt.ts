import { SignJWT, jwtVerify } from 'jose';
import { Role } from '@prisma/client';

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  fullName: string;
  studentProfileId?: string;
  teacherProfileId?: string;
  classId?: string;
  [key: string]: unknown;
}

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'attendance_academic_secure_jwt_secret_key_2026_dev_mode'
);

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

