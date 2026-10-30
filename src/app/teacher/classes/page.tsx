import { requireRole } from '@/lib/auth/session';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DashboardShell } from '@/components/layout/DashboardShell';
import Link from 'next/link';
import { School, BookOpen, CalendarCheck, ArrowRight, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeacherClassesPage() {
  const session = await requireRole([Role.TEACHER]);

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.userId },
    include: {
      assignments: {
        include: {
          classroom: {
            include: {
              _count: {
                select: { students: true, attendanceSessions: true },
              },
            },
          },
          subject: true,
        },
      },
    },
  });

  const assignments = teacherProfile?.assignments || [];

  return (
    <DashboardShell user={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Assigned Classes & Curriculum
          </h1>
          <p className="text-sm text-slate-500">
            Teaching load, class rosters, and subject allocations
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No classes or subjects have been assigned to your profile yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-900">
                      <School className="h-5 w-5 text-indigo-700" />
                    </div>
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {a.subject.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-4 leading-snug">
                    {a.subject.name}
                  </h3>

                  <div className="mt-2 text-xs text-slate-600">
                    <div>
                      Cohort: <strong>{a.classroom.name}</strong>
                    </div>
                    <div>
                      Section: <strong>{a.classroom.section}</strong> (AY {a.classroom.academicYear})
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      {a.classroom._count.students} Students
                    </span>
                    <span>•</span>
                    <span>{a.classroom._count.attendanceSessions} Recorded Sessions</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/teacher/attendance?classId=${a.classroom.id}&subjectId=${a.subject.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    <span>Take Attendance</span>
                  </Link>

                  <Link
                    href={`/teacher/reports?classId=${a.classroom.id}&subjectId=${a.subject.id}`}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    View Reports
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

