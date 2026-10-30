'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  HelpCircle,
  Save,
  CheckCheck,
  Calendar,
  AlertCircle,
  Loader2,
  BookOpen,
  School,
  History,
} from 'lucide-react';
import { AttendanceStatus } from '@prisma/client';
import { toast } from 'sonner';
import { getTodayIST } from '@/lib/utils/date';

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

interface StudentItem {
  id: string;
  rollNumber: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface AttendanceRecordState {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
}

interface AttendanceRegisterProps {
  userRole: 'ADMIN' | 'TEACHER';
  defaultClassId?: string;
  defaultSubjectId?: string;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  userRole,
  defaultClassId,
  defaultSubjectId,
}) => {
  const todayStr = getTodayIST();

  const [classes, setClasses] = useState<ClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(defaultSubjectId || '');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecordState>>({});
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [existingSessionInfo, setExistingSessionInfo] = useState<{
    markedBy: { fullName: string };
    updatedAt: string;
  } | null>(null);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load available classes and subjects
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
          if (assignments.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(assignments[0].subject.id);
          }
        } else {
          // Admin: fetch all classes and subjects
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
          if (subData.subjects?.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(subData.subjects[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading filters:', err);
        toast.error('Failed to load classes or subjects');
      } finally {
        setLoadingFilters(false);
      }
    }

    loadOptions();
  }, [userRole]);

  // Load session & students whenever class, subject, or date changes
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate) return;

    async function loadSession() {
      setLoadingRegister(true);
      try {
        const res = await fetch(
          `/api/attendance/session?classId=${selectedClassId}&subjectId=${selectedSubjectId}&date=${selectedDate}`
        );
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to fetch attendance register');
          setStudents([]);
          setRecords({});
          return;
        }

        const enrolledStudents: StudentItem[] = data.students || [];
        setStudents(enrolledStudents);

        const newRecords: Record<string, AttendanceRecordState> = {};

        if (data.existingSession) {
          setIsExistingSession(true);
          setExistingSessionInfo({
            markedBy: data.existingSession.markedBy,
            updatedAt: data.existingSession.updatedAt,
          });

          // Populate with saved statuses
          for (const r of data.existingSession.records) {
            newRecords[r.studentId] = {
              studentId: r.studentId,
              status: r.status,
              remarks: r.remarks || '',
            };
          }
        } else {
          setIsExistingSession(false);
          setExistingSessionInfo(null);
          // Default unrecorded students
          for (const s of enrolledStudents) {
            newRecords[s.id] = {
              studentId: s.id,
              status: AttendanceStatus.PRESENT, // default present when creating new
              remarks: '',
            };
          }
        }

        setRecords(newRecords);
      } catch (err) {
        console.error('Error loading session:', err);
        toast.error('Failed to load attendance session');
      } finally {
        setLoadingRegister(false);
      }
    }

    loadSession();
  }, [selectedClassId, selectedSubjectId, selectedDate]);

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setRecords((prev) => {
      const updated = { ...prev };
      for (const studentId of Object.keys(updated)) {
        updated[studentId] = {
          ...updated[studentId],
          status,
        };
      }
      return updated;
    });
    toast.info(`Marked all students as ${status}`);
  };

  const handleSave = async () => {
    if (students.length === 0) {
      toast.error('No students in this class to record attendance for');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        attendanceDate: selectedDate,
        records: Object.values(records),
      };

      const res = await fetch('/api/attendance/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to save attendance');
        setSaving(false);
        return;
      }

      toast.success(data.message || 'Attendance saved successfully!');
      setIsExistingSession(true);
    } catch {
      toast.error('Network error saving attendance');
    } finally {
      setSaving(false);
    }
  };

  // Status counts
  const counts = Object.values(records).reduce(
    (acc, r) => {
      if (r.status === AttendanceStatus.PRESENT) acc.present++;
      else if (r.status === AttendanceStatus.ABSENT) acc.absent++;
      else if (r.status === AttendanceStatus.LATE) acc.late++;
      else if (r.status === AttendanceStatus.EXCUSED) acc.excused++;
      return acc;
    },
    { present: 0, absent: 0, late: 0, excused: 0 }
  );

  if (loadingFilters) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Control Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Classroom
            </label>
            <div className="relative">
              <School className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Section {c.section} ({c.academicYear})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Select Subject
            </label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Attendance Date (IST)
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Existing Session Alert */}
        {isExistingSession && existingSessionInfo && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-700 shrink-0" />
              <span>
                <strong>Existing Session Loaded:</strong> Originally recorded by{' '}
                <strong>{existingSessionInfo.markedBy.fullName}</strong>. Any changes submitted will be
                logged in the institutional audit trail.
              </span>
            </div>
            <span className="text-[11px] text-indigo-700 font-medium">Mode: Editing</span>
          </div>
        )}
      </div>

      {/* Main Register Table & Batch Action Bar */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Action and Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 p-4">
          {/* Counters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold">
            <span className="text-slate-600">Total: {students.length}</span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Present: {counts.present}
            </span>
            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              Absent: {counts.absent}
            </span>
            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Late: {counts.late}
            </span>
            <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Excused: {counts.excused}
            </span>
          </div>

          {/* Convenience Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Mark All Present</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-rose-600" />
              <span>Mark All Absent</span>
            </button>

            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-teal-400" />
                  <span>{isExistingSession ? 'Update Attendance' : 'Save Attendance'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Student Register Table */}
        {loadingRegister ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No active students enrolled in this classroom.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28">Roll No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const currentStatus = records[student.id]?.status || AttendanceStatus.PRESENT;
                  const currentRemarks = records[student.id]?.remarks || '';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {student.rollNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{student.user.fullName}</div>
                        <div className="text-[11px] text-slate-400">{student.user.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, AttendanceStatus.PRESENT)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              currentStatus === AttendanceStatus.PRESENT
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, AttendanceStatus.ABSENT)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              currentStatus === AttendanceStatus.ABSENT
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <X className="h-3 w-3" />
                            <span>Absent</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, AttendanceStatus.LATE)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              currentStatus === AttendanceStatus.LATE
                                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600 ring-offset-1'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            <span>Late</span>
                          </button>

                          {/* Excused Button */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, AttendanceStatus.EXCUSED)}
                            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                              currentStatus === AttendanceStatus.EXCUSED
                                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <HelpCircle className="h-3 w-3" />
                            <span>Excused</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={currentRemarks}
                          onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                          placeholder="Optional remarks (e.g. sick leave, duty)"
                          className="w-full rounded border border-slate-200 py-1 px-2 text-xs focus:border-indigo-600 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Attendance changes are atomically committed to PostgreSQL with audit records.
          </span>
          <button
            type="button"
            disabled={saving || students.length === 0}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving to RDS...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-teal-400" />
                <span>{isExistingSession ? 'Update Attendance Session' : 'Submit Attendance Session'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

