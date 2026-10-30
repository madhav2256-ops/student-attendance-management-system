import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AttendanceRegister } from '@/components/attendance/AttendanceRegister';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage() {
  const session = await requireRole([Role.ADMIN]);

  return (
    <DashboardShell user={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institution Attendance Register
          </h1>
          <p className="text-sm text-slate-500">
            Open, record, or update attendance registers across any academic cohort with administrative override permissions
          </p>
        </div>

        <AttendanceRegister userRole="ADMIN" />
      </div>
    </DashboardShell>
  );
}

