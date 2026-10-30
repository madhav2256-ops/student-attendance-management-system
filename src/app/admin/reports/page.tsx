import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AttendanceReportsView } from '@/components/reports/AttendanceReportsView';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const session = await requireRole([Role.ADMIN]);

  return (
    <DashboardShell user={session}>
      <AttendanceReportsView userRole="ADMIN" />
    </DashboardShell>
  );
}

