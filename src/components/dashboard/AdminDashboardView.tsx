'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  School,
  CheckCircle2,
  XCircle,
  Percent,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  CalendarCheck,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

export const AdminDashboardView: React.FC = () => {
  const [data, setData] = useState<{
    kpis: {
      totalStudents: number;
      totalTeachers: number;
      totalClasses: number;
      todayPresent: number;
      todayAbsent: number;
      todayPercentage: string;
    };
    unmarkedClasses: Array<{ id: string; name: string; section: string }>;
    trendData: Array<{ date: string; present: number; absent: number; percentage: number | null }>;
    classComparison: Array<{ className: string; percentage: number; totalSessions: number }>;
    recentSessions: Array<{
      id: string;
      attendanceDate: string;
      classroom: { name: string; section: string };
      subject: { name: string; code: string };
      markedBy: { fullName: string };
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/institution')
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
        Failed to load institutional dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Administration
          </h1>
          <p className="text-sm text-slate-500">
            Real-time attendance overview, cloud metrics, and operational controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5 text-indigo-700" />
            <span>Add Student</span>
          </Link>
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <School className="h-3.5 w-3.5 text-indigo-700" />
            <span>Add Class</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Open Attendance Register</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Students</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.kpis.totalStudents}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Faculty</span>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.kpis.totalTeachers}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Classrooms</span>
            <School className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.kpis.totalClasses}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Present Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{data.kpis.todayPresent}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Absent Today</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{data.kpis.todayAbsent}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Attendance %</span>
            <Percent className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{data.kpis.todayPercentage}</div>
        </div>
      </div>

      {/* Unmarked Classes Alert */}
      {data.unmarkedClasses && data.unmarkedClasses.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                Attendance Pending for Today ({data.unmarkedClasses.length} Classes)
              </h3>
              <p className="mt-1 text-xs text-amber-700">
                The following classes have not yet submitted attendance registers for today:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.unmarkedClasses.map((cls) => (
                  <span
                    key={cls.id}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-300 shadow-2xs"
                  >
                    {cls.name} ({cls.section})
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/admin/attendance"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-800"
            >
              <span>Record Now</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">7-Day Attendance Trend</h2>
              <p className="text-xs text-slate-500">Historical student attendance percentages</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value ?? 0}%`, 'Attendance']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Comparison Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Class-Wise Comparison</h2>
              <p className="text-xs text-slate-500">Cumulative attendance across classes</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.classComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip formatter={(value: any) => [`${value ?? 0}%`, 'Attendance']} />
                <Bar dataKey="percentage" fill="#312e81" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Attendance Sessions</h2>
            <p className="text-xs text-slate-500">Latest recorded classroom sessions</p>
          </div>
          <Link
            href="/admin/reports"
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
          >
            <span>View Full Reports</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Marked By</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {s.attendanceDate.split('T')[0]}
                  </td>
                  <td className="py-3 px-3">
                    {s.classroom.name} ({s.classroom.section})
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">{s.subject.code}</span> - {s.subject.name}
                  </td>
                  <td className="py-3 px-3">{s.markedBy.fullName}</td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href="/admin/attendance"
                      className="font-medium text-indigo-700 hover:underline"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

