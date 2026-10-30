import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  Database,
  Users,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Cloud,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
          </div>
          <span className="text-xl font-bold tracking-tight text-indigo-950">
            Cloud<span className="text-teal-600">Attendance</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
          >
            Access Portal
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-900 mb-6">
            <Cloud className="h-4 w-4 text-teal-600" />
            <span>AWS Cloud Computing Academic Project</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 max-w-3xl mx-auto leading-tight">
            Cloud-Based Student Attendance Management System
          </h1>

          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A production-ready academic system built with Next.js App Router, powered by
            Amazon EC2 virtual compute and backed by a secured Amazon RDS PostgreSQL database.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-indigo-800 transition-colors"
            >
              <span>Launch Application</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cloud Architecture Overview */}
      <section className="py-16 max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Multi-Tier AWS Cloud Architecture
          </h2>
          <p className="mt-2 text-slate-600">
            Engineered for high availability, enterprise isolation, and zero-trust security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-900 mb-4">
              <Server className="h-6 w-6 text-indigo-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Amazon EC2 Web Server</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Runs Ubuntu LTS, Nginx reverse proxy, Node.js process management, and Next.js App Router with Server Actions.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-900 mb-4">
              <Database className="h-6 w-6 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Amazon RDS PostgreSQL</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Fully managed relational database deployed in private subnets, accessible only through security groups on port 5432.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-900 mb-4">
              <ShieldCheck className="h-6 w-6 text-purple-700" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Role-Based Access Control</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Three strict roles (Admin, Teacher, Student) with server-side validation, JWT sessions, and tamper-proof audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* Core Workflow Features */}
      <section className="bg-slate-100/60 border-t border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Complete Attendance Workflow
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-teal-600 font-bold text-sm mb-1">01. Setup</div>
              <div className="font-semibold text-slate-800">Class & Teacher Mapping</div>
              <p className="text-xs text-slate-500 mt-1">Admin defines academic years, classrooms, subjects, and assigns teachers.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-teal-600 font-bold text-sm mb-1">02. Register</div>
              <div className="font-semibold text-slate-800">Mark Attendance</div>
              <p className="text-xs text-slate-500 mt-1">Teachers record Present, Absent, Late, or Excused with convenient Mark All.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-teal-600 font-bold text-sm mb-1">03. Audit</div>
              <div className="font-semibold text-slate-800">Atomic Transactions</div>
              <p className="text-xs text-slate-500 mt-1">Prisma transactions ensure consistency and log modifications with actor IDs.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-teal-600 font-bold text-sm mb-1">04. Analytics</div>
              <div className="font-semibold text-slate-800">Reports & CSV Export</div>
              <p className="text-xs text-slate-500 mt-1">Institutional metrics, threshold warnings, and sanitized CSV exports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Cloud-Based Student Attendance Management System • AWS EC2 & RDS Academic Project
      </footer>
    </div>
  );
}
