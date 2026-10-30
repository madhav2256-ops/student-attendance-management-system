import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AttendanceReportsView } from '@/components/reports/AttendanceReportsView';

export const dynamic = 'force-dynamic';

export default async function TeacherReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await requireRole([Role.TEACHER]);
  const params = await searchParams;

  return (
    <DashboardShell user={session}>
      <AttendanceReportsView userRole="TEACHER" defaultClassId={params.classId} />
    </DashboardShell>
  );
}

