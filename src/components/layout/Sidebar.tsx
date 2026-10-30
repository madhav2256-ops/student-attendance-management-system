'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  UserCheck,
  CalendarCheck,
  BarChart3,
  History,
  User,
  Shield,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface SidebarProps {
  role: Role;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case Role.ADMIN:
        return [
          { label: 'Admin Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Students', href: '/admin/students', icon: Users },
          { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
          { label: 'Classes & Sections', href: '/admin/classes', icon: School },
          { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
          { label: 'Teacher Assignments', href: '/admin/assignments', icon: UserCheck },
          { label: 'Attendance Manager', href: '/admin/attendance', icon: CalendarCheck },
          { label: 'Institution Reports', href: '/admin/reports', icon: BarChart3 },
          { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
        ];
      case Role.TEACHER:
        return [
          { label: 'Teacher Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'My Assigned Classes', href: '/teacher/classes', icon: School },
          { label: 'Mark Attendance', href: '/teacher/attendance', icon: CalendarCheck },
          { label: 'Attendance History', href: '/teacher/history', icon: History },
          { label: 'Class Reports', href: '/teacher/reports', icon: BarChart3 },
        ];
      case Role.STUDENT:
        return [
          { label: 'Student Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'My Overview', href: '/student/overview', icon: User },
          { label: 'Attendance Records', href: '/student/attendance', icon: CalendarCheck },
          { label: 'Subject Reports', href: '/student/reports', icon: BarChart3 },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full lg:w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex flex-col h-full py-4 px-3">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-teal-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 px-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <Shield className="h-3.5 w-3.5 text-teal-600" />
              <span>Academic Security</span>
            </div>
            Role-Based Access Control enforced on AWS EC2 & RDS.
          </div>
        </div>
      </div>
    </aside>
  );
};

