import { requireAuth } from '@/lib/auth/session';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminDashboardView } from '@/components/dashboard/AdminDashboardView';
import { TeacherDashboardView } from '@/components/dashboard/TeacherDashboardView';
import { StudentDashboardView } from '@/components/dashboard/StudentDashboardView';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <DashboardShell user={session}>
      {session.role === Role.ADMIN && <AdminDashboardView />}
      {session.role === Role.TEACHER && <TeacherDashboardView />}
      {session.role === Role.STUDENT && <StudentDashboardView />}
    </DashboardShell>
  );
}
