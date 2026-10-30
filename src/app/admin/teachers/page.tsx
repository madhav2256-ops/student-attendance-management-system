'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  GraduationCap,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherItem {
  id: string;
  employeeCode?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
  assignments: Array<{
    id: string;
    classroom: { name: string; section: string };
    subject: { name: string; code: string };
  }>;
}

export default function AdminTeachersPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'ADMIN';
  } | null>(null);

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/teachers');
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch {
      toast.error('Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          employeeCode: employeeCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create faculty account');
        setSubmitting(false);
        return;
      }

      toast.success('Teacher account created successfully!');
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setEmployeeCode('');
      loadTeachers();
    } catch {
      toast.error('Network error creating teacher');
    } finally {
      setSubmitting(false);
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
              Faculty & Teacher Directory
            </h1>
            <p className="text-sm text-slate-500">
              Manage instructors, employee codes, and course teaching allocations
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>

        {/* Teachers Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No faculty members registered.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Employee Code</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Subjects & Classes</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {t.user.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {t.employeeCode || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{t.user.email}</td>
                      <td className="py-3 px-4">
                        {t.assignments.length === 0 ? (
                          <span className="text-slate-400 italic">No classes assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {t.assignments.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                <strong>{a.subject.code}:</strong> {a.classroom.name} ({a.classroom.section})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.user.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Teacher Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Add Faculty Member</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name (with Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@attendance.edu"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="e.g. EMP-103"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
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
                    {submitting ? 'Creating...' : 'Register Teacher'}
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

