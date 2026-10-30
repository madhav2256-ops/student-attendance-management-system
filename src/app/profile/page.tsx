import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { User, Shield, School, Award, Clock } from 'lucide-react';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: {
        include: { classroom: true },
      },
      teacherProfile: {
        include: {
          assignments: {
            include: {
              classroom: true,
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return (
    <DashboardShell user={session}>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
          <p className="text-sm text-slate-500">
            Account identity, role credentials, and institutional mapping
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-900">
              <User className="h-8 w-8 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 uppercase">
                  {user.role}
                </span>
                <span className="text-xs text-emerald-600 font-medium">● Active Account</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
              <div className="text-xs font-medium text-slate-500 uppercase">System ID</div>
              <div className="font-mono text-xs text-slate-800 mt-1">{user.id}</div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
              <div className="text-xs font-medium text-slate-500 uppercase">Account Created</div>
              <div className="text-xs text-slate-800 mt-1">
                {user.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Student Profile Info */}
          {user.role === Role.STUDENT && user.studentProfile && (
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <School className="h-4 w-4 text-teal-600" />
                <span>Student Academic Details</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="text-slate-500">Roll Number</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {user.studentProfile.rollNumber}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="text-slate-500">Class & Section</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {user.studentProfile.classroom.name} ({user.studentProfile.classroom.section})
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 bg-white">
                  <div className="text-slate-500">Academic Year</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {user.studentProfile.classroom.academicYear}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Profile Info */}
          {user.role === Role.TEACHER && user.teacherProfile && (
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-600" />
                <span>Faculty Information & Teaching Load</span>
              </h3>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 text-xs">
                <div>Employee Code: <strong>{user.teacherProfile.employeeCode || 'N/A'}</strong></div>
                <div className="mt-2 text-slate-600">Assigned Subjects:</div>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  {user.teacherProfile.assignments.map((a) => (
                    <li key={a.id}>
                      {a.subject.name} ({a.subject.code}) — {a.classroom.name} ({a.classroom.section})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-teal-600" />
              Role permissions validated on AWS EC2 & RDS
            </span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

