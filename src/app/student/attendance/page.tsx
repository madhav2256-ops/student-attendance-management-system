'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarCheck, Filter, Search, Loader2, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  recordId: string;
  date: string;
  subjectName: string;
  subjectCode: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
  markedBy: string;
}

export default function StudentAttendancePage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'STUDENT';
  } | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/reports/student?${params.toString()}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [startDate, endDate]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
      </div>
    );
  }

  const filteredHistory = history.filter((h) => {
    if (subjectFilter && !h.subjectName.toLowerCase().includes(subjectFilter.toLowerCase()) && !h.subjectCode.toLowerCase().includes(subjectFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <DashboardShell user={currentUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance Log & Register History
          </h1>
          <p className="text-sm text-slate-500">
            Individual session records, statuses, and instructor remarks
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              placeholder="Filter by subject name or code..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              title="Start Date"
            />
            <span className="self-center text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              title="End Date"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Session Date</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((h) => {
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
                      <tr key={h.recordId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-medium text-slate-900">{h.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{h.subjectCode}</span> - {h.subjectName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusPill(
                              h.status
                            )}`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 italic text-slate-500">
                          {h.remarks || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{h.markedBy}</td>
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

