'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserCheck, Plus, Trash2, Loader2, X, School, BookOpen, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentItem {
  id: string;
  teacher: {
    id: string;
    employeeCode?: string;
    user: { fullName: string; email: string };
  };
  classroom: { id: string; name: string; section: string; academicYear: string };
  subject: { id: string; name: string; code: string };
  createdAt: string;
}

interface TeacherOption {
  id: string;
  user: { fullName: string };
}

interface ClassroomOption {
  id: string;
  name: string;
  section: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export default function AdminAssignmentsPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'ADMIN';
  } | null>(null);

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assRes, teaRes, clsRes, subRes] = await Promise.all([
        fetch('/api/admin/assignments'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/classes'),
        fetch('/api/admin/subjects'),
      ]);

      const [assData, teaData, clsData, subData] = await Promise.all([
        assRes.json(),
        teaRes.json(),
        clsRes.json(),
        subRes.json(),
      ]);

      setAssignments(assData.assignments || []);
      setTeachers(teaData.teachers || []);
      setClasses(clsData.classrooms || []);
      setSubjects(subData.subjects || []);

      if (teaData.teachers?.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teaData.teachers[0].id);
      }
      if (clsData.classrooms?.length > 0 && !selectedClassId) {
        setSelectedClassId(clsData.classrooms[0].id);
      }
      if (subData.subjects?.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subData.subjects[0].id);
      }
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create assignment');
        setSubmitting(false);
        return;
      }

      toast.success('Teacher assigned successfully!');
      setShowModal(false);
      loadData();
    } catch {
      toast.error('Network error creating assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this teaching assignment?')) return;

    try {
      const res = await fetch(`/api/admin/assignments?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to remove assignment');
        return;
      }
      toast.success('Assignment deleted');
      loadData();
    } catch {
      toast.error('Network error deleting assignment');
    }
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Teaching Allocations
            </h1>
            <p className="text-sm text-slate-500">
              Assign faculty instructors to classroom sections and course subjects
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Teaching Assignment</span>
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No teaching assignments defined yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Allocated On</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {a.teacher.user.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {a.teacher.user.email} {a.teacher.employeeCode ? `• ${a.teacher.employeeCode}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {a.classroom.name} ({a.classroom.section})
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800">{a.subject.code}</span> - {a.subject.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="rounded p-1 text-rose-600 hover:bg-rose-50"
                          title="Delete Assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Assign Teacher</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Faculty Member
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Classroom
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Section {c.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50"
                  >
                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

