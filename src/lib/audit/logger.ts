import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface AuditLogParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

// Strip sensitive fields from audit payload
function sanitizePayload(payload?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (!payload) return undefined;

  const sanitized = { ...payload };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'secretKey', 'authSecret'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized as Prisma.InputJsonValue;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousValues: sanitizePayload(params.previousValues),
        newValues: sanitizePayload(params.newValues),
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    // Audit logging shouldn't crash primary flows, but should log errors to server console
    console.error('Failed to create audit log entry:', error);
    return null;
  }
}

