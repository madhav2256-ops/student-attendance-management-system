'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please check credentials.');
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.fullName}!`);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error communicating with authentication service.');
      toast.error('Network error');
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-900 text-white shadow-md">
          <ShieldCheck className="h-7 w-7 text-teal-400" />
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Sign In to Cloud Attendance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Academic Attendance Portal hosted on AWS EC2 & RDS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="user@attendance.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-900 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Viva Demo Fill Buttons */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>One-Click Viva Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@attendance.edu', 'AdminPassword123!')}
                className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-100 transition-colors text-left"
              >
                <div className="font-bold">Admin</div>
                <div className="text-[10px] text-purple-600 truncate">admin@attendance.edu</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('prof.sharma@attendance.edu', 'TeacherPassword123!')}
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="font-bold">Teacher</div>
                <div className="text-[10px] text-blue-600 truncate">prof.sharma</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('aarav.mehta@student.edu', 'StudentPassword123!')}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors text-left"
              >
                <div className="font-bold">Student (Normal)</div>
                <div className="text-[10px] text-emerald-600 truncate">aarav.mehta</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('kabir.joshi@student.edu', 'StudentPassword123!')}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors text-left"
              >
                <div className="font-bold">Student (Low %)</div>
                <div className="text-[10px] text-amber-600 truncate">kabir.joshi</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

