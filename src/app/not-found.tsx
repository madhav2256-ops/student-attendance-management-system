import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-4 shadow-sm">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">404 - Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-600 max-w-md">
        The requested page or endpoint does not exist on this cloud attendance server.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

