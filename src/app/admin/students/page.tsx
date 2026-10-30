'use client';

import React, { useState, useEffect } from 'react';
import { requireAuth } from '@/lib/auth/session';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  Users,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  School,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentItem {
  id: string;
  rollNumber: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    createdAt: string;
  };
  classroom: {
    id: string;
    name: string;
    section: string;
    academicYear: string;
  };
}

interface ClassroomOption {
  id: string;
  name: string;
  section: string;
  academicYear: string;
}

export default function AdminStudentsPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'ADMIN';
  } | null>(null);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassroomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      });
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (classFilter) params.append('classId', classFilter);

      const [stuRes, clsRes] = await Promise.all([
        fetch(`/api/admin/students?${params.toString()}`),
        fetch('/api/admin/classes'),
      ]);

      const stuData = await stuRes.json();
      const clsData = await clsRes.json();

      setStudents(stuData.students || []);
      setClasses(clsData.classrooms || []);
      if (clsData.classrooms?.length > 0 && !selectedClassId) {
        setSelectedClassId(clsData.classrooms[0].id);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, classFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          rollNumber,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create student');
        setSubmitting(false);
        return;
      }

      toast.success('Student account created successfully!');
      setShowModal(false);
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setRollNumber('');
      loadData();
    } catch {
      toast.error('Error creating student');
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
              Student Directory
            </h1>
            <p className="text-sm text-slate-500">
              Manage student enrollment, class assignments, and active accounts
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or email..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="sm:w-64">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Classrooms</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — Section {c.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No students found matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Classroom</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Enrolled Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.rollNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{s.user.fullName}</td>
                      <td className="py-3 px-4">
                        {s.classroom.name} ({s.classroom.section})
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.user.email}</td>
                      <td className="py-3 px-4">
                        {s.user.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                            <XCircle className="h-3 w-3" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(s.user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Student Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Enroll New Student</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Mehta"
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
                    placeholder="student@attendance.edu"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
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
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 2025-CS-009"
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enrolled Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-indigo-600 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Section {c.section} ({c.academicYear})
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
                    {submitting ? 'Creating...' : 'Enroll Student'}
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

