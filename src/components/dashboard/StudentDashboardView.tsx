'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface AttendanceRecordItem {
  recordId: string;
  date: string;
  subjectName: string;
  subjectCode: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  markedBy: string;
}

interface SubjectStat {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number | null;
  percentageFormatted: string;
}

export const StudentDashboardView: React.FC = () => {
  const [data, setData] = useState<{
    student: {
      id: string;
      fullName: string;
      email: string;
      rollNumber: string;
      classroom: string;
      academicYear: string;
    };
    overallStats: {
      present: number;
      absent: number;
      late: number;
      excused: number;
      total: number;
      eligibleSessions: number;
      attendedSessions: number;
      percentage: number | null;
      percentageFormatted: string;
    };
    subjectBreakdown: SubjectStat[];
    history: AttendanceRecordItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/student')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
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

  if (!data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        Failed to load student attendance overview.
      </div>
    );
  }

  const isLowAttendance =
    data.overallStats.percentage !== null && data.overallStats.percentage < 75.0;

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Student Attendance Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {data.student.fullName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Roll Number: <strong className="text-slate-800">{data.student.rollNumber}</strong></span>
              <span>•</span>
              <span>Enrolled Class: <strong className="text-slate-800">{data.student.classroom}</strong></span>
              <span>•</span>
              <span>Academic Year: <strong className="text-slate-800">{data.student.academicYear}</strong></span>
            </div>
          </div>

          {/* Big Attendance Percentage Pill */}
          <div
            className={`rounded-2xl border p-4 text-center min-w-36 ${
              isLowAttendance
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-teal-200 bg-teal-50 text-teal-900'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider">Overall Attendance</div>
            <div className="text-3xl font-extrabold mt-1">
              {data.overallStats.percentageFormatted}
            </div>
            <div className="text-[11px] mt-0.5 opacity-80">
              {isLowAttendance ? '⚠️ Below 75% Requirement' : '✓ Good Standing'}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Policy Explanation Card */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 leading-relaxed">
            <span className="font-bold">Official Institutional Attendance Calculation Formula:</span>
            <div className="mt-1 font-mono text-xs bg-white/70 rounded px-2 py-1 inline-block border border-indigo-200">
              Attendance % = ((Present + Late) / (Present + Absent + Late)) × 100
            </div>
            <p className="mt-1 text-indigo-800">
              Sessions marked as <strong>Excused</strong> (e.g. medical leave or official college duty)
              are formally excluded from the denominator.
            </p>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning Banner */}
      {isLowAttendance && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Shortage of Attendance Warning:</span> Your current attendance is below the mandatory 75% minimum required by the University examination board. Please attend remaining sessions.
          </div>
        </div>
      )}

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Present</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{data.overallStats.present}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sessions attended</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Late</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{data.overallStats.late}</div>
          <div className="text-[11px] text-slate-400 mt-1">Counted in attended</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Absent</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{data.overallStats.absent}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unexcused absences</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Excused</span>
            <HelpCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{data.overallStats.excused}</div>
          <div className="text-[11px] text-slate-400 mt-1">Excluded from denominator</div>
        </div>
      </div>

      {/* Subject-Wise Performance Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Subject-Wise Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.subjectBreakdown.map((sub) => (
            <div key={sub.subjectId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                    {sub.subjectCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{sub.subjectName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">{sub.percentageFormatted}</div>
                  <div className="text-[11px] text-slate-500">Attendance</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    sub.percentage !== null && sub.percentage < 75
                      ? 'bg-rose-500'
                      : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, sub.percentage ?? 0)}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>Present: <strong className="text-emerald-700">{sub.present}</strong></span>
                <span>Late: <strong className="text-amber-700">{sub.late}</strong></span>
                <span>Absent: <strong className="text-rose-700">{sub.absent}</strong></span>
                <span>Excused: <strong className="text-blue-700">{sub.excused}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attendance History Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Attendance Logs</h2>
            <p className="text-xs text-slate-500">Your logged classroom sessions</p>
          </div>
          <Link
            href="/student/attendance"
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Remarks</th>
                <th className="py-2.5 px-3">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.history.slice(0, 8).map((h) => {
                const getStatusPill = (status: string) => {
                  switch (status) {
                    case 'PRESENT':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    case 'ABSENT':
                      return 'bg-rose-100 text-rose-800 border-rose-200';
                    case 'LATE':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'EXCUSED':
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                    default:
                      return 'bg-slate-100 text-slate-800';
                  }
                };

                return (
                  <tr key={h.recordId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-medium text-slate-900">{h.date}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{h.subjectCode}</span> - {h.subjectName}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusPill(h.status)}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 italic">
                      {h.remarks || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{h.markedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

