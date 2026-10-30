'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  School,
  BookOpen,
  CalendarCheck,
  History,
  ArrowRight,
  Loader2,
  Users,
} from 'lucide-react';
import { getTodayIST } from '@/lib/utils/date';

interface TeacherAssignment {
  id: string;
  classroom: { id: string; name: string; section: string; academicYear: string };
  subject: { id: string; name: string; code: string };
}

export const TeacherDashboardView: React.FC = () => {
  const [user, setUser] = useState<{
    id: string;
    fullName: string;
    email: string;
    teacherProfile?: {
      employeeCode?: string;
      assignments: TeacherAssignment[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const today = getTodayIST();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
      </div>
    );
  }

  const assignments = user?.teacherProfile?.assignments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Welcome, {user?.fullName}. Record attendance, review registers, and track class attendance.
          </p>
        </div>

        <Link
          href="/teacher/attendance"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
        >
          <CalendarCheck className="h-4 w-4 text-teal-400" />
          <span>Mark Today&apos;s Attendance ({today})</span>
        </Link>
      </div>

      {/* Assigned Classes & Subjects Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Your Assigned Subjects & Classes</h2>
          <span className="text-xs text-slate-500">{assignments.length} Total Assignments</span>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No teaching assignments have been mapped to your profile yet. Please contact the administrator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-900">
                    <BookOpen className="h-5 w-5 text-indigo-700" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {a.subject.code}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{a.subject.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <School className="h-3.5 w-3.5" />
                    <span>
                      {a.classroom.name} — Section {a.classroom.section}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Academic Year {a.classroom.academicYear}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <Link
                    href={`/teacher/attendance?classId=${a.classroom.id}&subjectId=${a.subject.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    <span>Open Register</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <Link
                    href={`/teacher/reports?classId=${a.classroom.id}&subjectId=${a.subject.id}`}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Reports
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/teacher/history"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Attendance History</div>
              <div className="text-xs text-slate-500">Search and audit historical registers</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/teacher/reports"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Class Attendance Summary</div>
              <div className="text-xs text-slate-500">Filter students and export CSV reports</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
};

