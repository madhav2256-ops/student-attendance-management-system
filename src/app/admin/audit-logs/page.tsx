'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { History, Shield, Loader2, ChevronLeft, ChevronRight, User, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  createdAt: string;
  actor?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    email: string;
    role: 'ADMIN';
  } | null>(null);

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      });
  }, []);

  const loadLogs = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${pageNum}&limit=15`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(data.pagination?.page || 1);
    } catch {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
  }, [page]);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Security & Compliance Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Immutable log trail of attendance recordings, modifications, and administrative changes
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-900" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp (IST)</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Payload Delta</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => {
                    const getActionBadge = (act: string) => {
                      if (act.includes('UPDATED')) {
                        return 'bg-amber-100 text-amber-800 border-amber-200';
                      }
                      if (act.includes('CREATED') || act.includes('RECORDED')) {
                        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      }
                      if (act.includes('DELETED')) {
                        return 'bg-rose-100 text-rose-800 border-rose-200';
                      }
                      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
                    };

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {log.actor ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {log.actor.fullName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {log.actor.role} • {log.actor.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">System Process</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{log.entityType}</span>
                          <span className="block font-mono text-[10px] text-slate-400 truncate max-w-xs">
                            {log.entityId}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          {log.newValues || log.previousValues ? (
                            <details className="cursor-pointer text-[11px]">
                              <summary className="text-indigo-700 font-medium hover:underline">
                                View Changes
                              </summary>
                              <div className="mt-1 rounded bg-slate-900 text-slate-100 p-2 font-mono text-[10px] overflow-x-auto max-h-36">
                                {log.previousValues && (
                                  <div className="mb-1 text-rose-300">
                                    <strong>Before:</strong> {JSON.stringify(log.previousValues)}
                                  </div>
                                )}
                                {log.newValues && (
                                  <div className="text-emerald-300">
                                    <strong>After:</strong> {JSON.stringify(log.newValues)}
                                  </div>
                                )}
                              </div>
                            </details>
                          ) : (
                            <span className="text-slate-400 italic">No details</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-200 bg-white p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-slate-200 bg-white p-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

