import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AttendanceRegister } from '@/components/attendance/AttendanceRegister';

export const dynamic = 'force-dynamic';

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; subjectId?: string }>;
}) {
  const session = await requireRole([Role.TEACHER]);
  const params = await searchParams;

  return (
    <DashboardShell user={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance Register
          </h1>
          <p className="text-sm text-slate-500">
            Record daily student attendance, specify remarks, and update records for assigned cohorts
          </p>
        </div>

        <AttendanceRegister
          userRole="TEACHER"
          defaultClassId={params.classId}
          defaultSubjectId={params.subjectId}
        />
      </div>
    </DashboardShell>
  );
}

