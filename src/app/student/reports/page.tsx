import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentDashboardView } from '@/components/dashboard/StudentDashboardView';

export const dynamic = 'force-dynamic';

export default async function StudentReportsPage() {
  const session = await requireRole([Role.STUDENT]);

  return (
    <DashboardShell user={session}>
      <StudentDashboardView />
    </DashboardShell>
  );
}

