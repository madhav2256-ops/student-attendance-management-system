'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  Printer,
  AlertTriangle,
  School,
  BookOpen,
  Calendar,
  Percent,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentReportItem {
  studentId: string;
  rollNumber: string;
  fullName: string;
  email: string;
  className: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalSessions: number;
  attendedSessions: number;
  eligibleSessions: number;
  percentage: number | null;
  percentageFormatted: string;
  isLowAttendance: boolean;
}

interface ClassroomOption {
  id: string;
  name: string;
  section: string;
  academicYear: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface AttendanceReportsViewProps {
  userRole: 'ADMIN' | 'TEACHER';
  defaultClassId?: string;
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  userRole,
  defaultClassId,
}) => {
  const [classes, setClasses] = useState<ClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [threshold, setThreshold] = useState<string>('75');
  const [onlyLowAttendance, setOnlyLowAttendance] = useState(false);

  const [reports, setReports] = useState<StudentReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load classes and subjects
  useEffect(() => {
    async function loadOptions() {
      try {
        if (userRole === 'TEACHER') {
          const res = await fetch('/api/auth/me');
          const data = await res.json();
          const assignments = data.user?.teacherProfile?.assignments || [];

          const classMap = new Map<string, ClassroomOption>();
          const subjectMap = new Map<string, SubjectOption>();

          for (const a of assignments) {
            classMap.set(a.classroom.id, a.classroom);
            subjectMap.set(a.subject.id, a.subject);
          }

          const classList = Array.from(classMap.values());
          setClasses(classList);
          setSubjects(Array.from(subjectMap.values()));
          if (classList.length > 0 && !selectedClassId) {
            setSelectedClassId(classList[0].id);
          }
        } else {
          const [classRes, subRes] = await Promise.all([
            fetch('/api/admin/classes'),
            fetch('/api/admin/subjects'),
          ]);
          const classData = await classRes.json();
          const subData = await subRes.json();
          setClasses(classData.classrooms || []);
          setSubjects(subData.subjects || []);
          if (classData.classrooms?.length > 0 && !selectedClassId) {
            setSelectedClassId(classData.classrooms[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }

    loadOptions();
  }, [userRole]);

  // Load report data
  const fetchReport = async () => {
    if (!selectedClassId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
      });

      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (onlyLowAttendance && threshold) params.append('threshold', threshold);

      const res = await fetch(`/api/reports/class?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to generate report');
        setReports([]);
        return;
      }

      setReports(data.studentReports || []);
    } catch {
      toast.error('Network error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      fetchReport();
    }
  }, [selectedClassId, selectedSubjectId, startDate, endDate, onlyLowAttendance, threshold]);

  const handleExportCsv = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class to export');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        classId: selectedClassId,
      });

      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (onlyLowAttendance && threshold) params.append('threshold', threshold);

      // Trigger browser download
      window.location.href = `/api/reports/export?${params.toString()}`;
      toast.success('Generating and downloading CSV report...');
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Summaries
  const totalStudents = reports.length;
  const lowCount = reports.filter(
    (r) => r.percentage !== null && r.percentage < parseFloat(threshold || '75')
  ).length;

  const validPercentages = reports
    .map((r) => r.percentage)
    .filter((p): p is number => p !== null);

  const averagePercentage =
    validPercentages.length > 0
      ? (
          validPercentages.reduce((a, b) => a + b, 0) / validPercentages.length
        ).toFixed(1)
      : 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Filtered attendance analysis, threshold audits, and CSV export
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting || reports.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Filter className="h-3.5 w-3.5 text-indigo-700" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom</label>
            <div className="relative">
              <School className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Section {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject (All or Specific)</label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
              >
                <option value="">All Subjects Combined</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Low Attendance Threshold Filter */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="checkbox"
                checked={onlyLowAttendance}
                onChange={(e) => setOnlyLowAttendance(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Filter Only Students Below Threshold</span>
            </label>

            {onlyLowAttendance && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Threshold:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
                />
                <span className="text-slate-500">%</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={fetchReport}
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Results</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Students Listed</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Class Average %</span>
            <Percent className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">
            {averagePercentage !== 'N/A' ? `${averagePercentage}%` : 'N/A'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Below {threshold}%</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-bold ${lowCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {lowCount}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No attendance records match the selected parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Roll No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3 text-center">Present</th>
                  <th className="py-3 px-3 text-center">Late</th>
                  <th className="py-3 px-3 text-center">Absent</th>
                  <th className="py-3 px-3 text-center">Excused</th>
                  <th className="py-3 px-3 text-center">Total Sessions</th>
                  <th className="py-3 px-3 text-right">Attendance %</th>
                  <th className="py-3 px-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((s) => {
                  const isLow = s.percentage !== null && s.percentage < parseFloat(threshold || '75');

                  return (
                    <tr key={s.studentId} className={isLow ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{s.rollNumber}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">{s.present}</td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">{s.late}</td>
                      <td className="py-3 px-3 text-center text-rose-700 font-bold">{s.absent}</td>
                      <td className="py-3 px-3 text-center text-blue-700 font-bold">{s.excused}</td>
                      <td className="py-3 px-3 text-center font-medium">{s.totalSessions}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {s.percentageFormatted}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                            Shortage Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            Eligible
                          </span>
                        )}
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
  );
};

