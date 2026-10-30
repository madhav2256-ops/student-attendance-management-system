import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { Role } from '@prisma/client';

describe('Authentication & Role-Based Token Security', () => {
  it('hashes passwords securely using bcrypt', async () => {
    const raw = 'SecureSecretPass123!';
    const hash = await bcrypt.hash(raw, 10);

    expect(hash).not.toBe(raw);
    const matches = await bcrypt.compare(raw, hash);
    expect(matches).toBe(true);

    const wrong = await bcrypt.compare('WrongPassword', hash);
    expect(wrong).toBe(false);
  });

  it('signs and verifies valid JWT session tokens with role payload', async () => {
    const payload = {
      userId: 'user-admin-1',
      email: 'admin@attendance.edu',
      fullName: 'System Administrator',
      role: Role.ADMIN,
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(Role.ADMIN);
  });

  it('rejects tampered or malformed tokens', async () => {
    const token = await signSessionToken({
      userId: 'user-stu-1',
      email: 'stu@attendance.edu',
      fullName: 'Student 1',
      role: Role.STUDENT,
    });

    const tampered = token.slice(0, -6) + 'xxxxxx';
    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });
});

