'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Server, ShieldCheck } from 'lucide-react';
import { Role } from '@prisma/client';
import { toast } from 'sonner';

interface NavbarProps {
  user: {
    fullName: string;
    email: string;
    role: Role;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast.success('Logged out successfully');
        router.push('/login');
        router.refresh();
      }
    } catch {
      toast.error('Failed to log out');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case Role.TEACHER:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case Role.STUDENT:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Brand & Cloud Status */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-indigo-950 hidden sm:inline">
            Cloud<span className="text-teal-600">Attendance</span>
          </span>
        </Link>

        {/* AWS Architecture Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
          <Server className="h-3.5 w-3.5 text-teal-600" />
          <span>AWS EC2 & RDS Multi-Tier</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-800 leading-tight">{user.fullName}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getRoleBadge(user.role)}`}>
            {user.role}
          </span>
        </div>

        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          title="My Profile"
        >
          <UserIcon className="h-4 w-4" />
        </Link>

        <button
          onClick={handleLogout}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

