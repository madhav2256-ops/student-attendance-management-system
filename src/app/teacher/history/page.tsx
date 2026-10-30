'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { History, Calendar, School, BookOpen, Loader2, ArrowRight, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

interface HistorySessionItem {
  id: string;
  attendanceDate: string;
  classroom: { id: string; name: string; section: string };
  subject: { id: string; name: string; code: string };
  markedBy: { fullName: string };
  records: Array<{
    id: string;
    status: string;
    student: { rollNumber: string; user: { fullName: string } };
  }>;
}

export default function TeacherHistoryPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'TEACHER';
  } | null>(null);

  const [sessions, setSessions] = useState<HistorySessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await fetch('/api/attendance/history');
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch {
        toast.error('Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
      </div>
    );
  }

  return (
    <DashboardShell user={currentUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance History & Archives
          </h1>
          <p className="text-sm text-slate-500">
            Chronological log of submitted attendance registers for your assigned classes
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No historical attendance registers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Session Date</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Attendance Breakdown</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const counts = s.records.reduce(
                      (acc, r) => {
                        if (r.status === 'PRESENT') acc.p++;
                        else if (r.status === 'ABSENT') acc.a++;
                        else if (r.status === 'LATE') acc.l++;
                        else if (r.status === 'EXCUSED') acc.e++;
                        return acc;
                      },
                      { p: 0, a: 0, l: 0, e: 0 }
                    );

                    const dateStr = s.attendanceDate.split('T')[0];

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-medium text-slate-900">{dateStr}</td>
                        <td className="py-3 px-4">
                          {s.classroom.name} ({s.classroom.section})
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{s.subject.code}</span> - {s.subject.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-[11px]">
                            <span className="text-emerald-700 font-bold">P: {counts.p}</span>
                            <span>•</span>
                            <span className="text-rose-700 font-bold">A: {counts.a}</span>
                            <span>•</span>
                            <span className="text-amber-700 font-bold">L: {counts.l}</span>
                            <span>•</span>
                            <span className="text-blue-700 font-bold">E: {counts.e}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/teacher/attendance?classId=${s.classroom.id}&subjectId=${s.subject.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900"
                          >
                            <span>Open & Edit</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

