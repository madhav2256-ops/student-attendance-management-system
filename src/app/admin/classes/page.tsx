'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { School, Plus, Loader2, Users, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';

interface ClassroomItem {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  _count: {
    students: number;
    assignments: number;
    attendanceSessions: number;
  };
}

export default function AdminClassesPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'ADMIN';
  } | null>(null);

  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      setClasses(data.classrooms || []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, section, academicYear }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create classroom');
        setSubmitting(false);
        return;
      }

      toast.success('Classroom created successfully!');
      setShowModal(false);
      setName('');
      setSection('');
      loadClasses();
    } catch {
      toast.error('Network error creating classroom');
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
              Classrooms & Sections
            </h1>
            <p className="text-sm text-slate-500">
              Configure academic cohorts, departments, and active semester sections
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Class</span>
          </button>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No classrooms configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-900">
                    <School className="h-5 w-5 text-indigo-700" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                    Sec {cls.section}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{cls.name}</h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Academic Year: <strong className="text-slate-800">{cls.academicYear}</strong>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-slate-50 p-2">
                    <div className="font-bold text-slate-900">{cls._count.students}</div>
                    <div className="text-[10px] text-slate-500">Students</div>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <div className="font-bold text-slate-900">{cls._count.assignments}</div>
                    <div className="text-[10px] text-slate-500">Subjects</div>
                  </div>
                  <div className="rounded bg-slate-50 p-2">
                    <div className="font-bold text-slate-900">{cls._count.attendanceSessions}</div>
                    <div className="text-[10px] text-slate-500">Sessions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Create Classroom</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. B.Tech CSE - 4th Sem"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, or C"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2025-2026"
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
                    {submitting ? 'Creating...' : 'Create Classroom'}
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

