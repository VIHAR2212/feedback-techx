'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';
import { GEMSTONE_TIERS } from '@/lib/models';
import { csvCell } from '@/lib/utils';

interface FeedbackEntry {
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  rating: number;
  comment: string;
  tableId: string;
  timestamp: string;
}

export default function AdminFeedbackPage() {
  const { logout } = useAdmin();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    email: '',
    productId: '',
    department: '',
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce filter changes so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (debouncedFilters.email) params.append('email', debouncedFilters.email);
        if (debouncedFilters.productId) params.append('productId', debouncedFilters.productId);
        if (debouncedFilters.department) params.append('department', debouncedFilters.department);
        const response = await fetch(`/api/admin/feedback?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch feedback');
        const data = await response.json();
        setFeedback(Array.isArray(data) ? data : (data.data || data.items || []));
        setError('');
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [debouncedFilters]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ email: '', productId: '', department: '' });
  };

  const exportFeedback = () => {
    const csv = [
      ['Name', 'Email', 'Department', 'Product ID', 'Gemstone', 'Comment', 'Timestamp'],
      ...feedback.map((f) => {
        const gem = GEMSTONE_TIERS.find((t) => t.tier === f.rating)?.name ?? String(f.rating);
        return [
          f.studentName,
          f.studentEmail,
          f.studentDepartment,
          f.tableId,
          gem,
          f.comment,
          f.timestamp,
        ];
      }),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uncharted-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminRouteGuard>
      <main className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-600/30">
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                title="Back to Dashboard"
              >
                ←
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400">
                    TechX Administration
                  </p>
                </div>
                <h1 className="text-base font-bold text-white">
                  Feedback Ledger
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportFeedback}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-500"
              >
                <span>⤓</span>
                <span className="hidden sm:inline">Export</span> CSV
              </button>
              <Link
                href="/admin"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-750 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/leaderboard"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-750 hover:text-white"
              >
                Rankings
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {/* Filter Bar */}
          <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Filter & Search Records
              </h2>
              {(filters.email || filters.productId || filters.department) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Explorer Email
                </label>
                <input
                  type="text"
                  placeholder="Filter by email…"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Product / Table ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. A1, B3…"
                  value={filters.productId}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-400">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI-DS, CSE…"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 py-16">
              <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="mt-3 text-xs text-slate-400">Loading feedback records…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-300">
              {error}
            </div>
          ) : feedback.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
              <p className="text-sm text-slate-400">No feedback entries match your active filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 inline-block text-xs font-semibold text-blue-400 transition hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3.5 font-semibold">Explorer</th>
                      <th className="px-4 py-3.5 font-semibold">Email</th>
                      <th className="px-4 py-3.5 font-semibold">Dept</th>
                      <th className="px-4 py-3.5 font-semibold">Product</th>
                      <th className="px-4 py-3.5 font-semibold">Gemstone</th>
                      <th className="px-4 py-3.5 font-semibold">Notes</th>
                      <th className="px-4 py-3.5 font-semibold">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {feedback.map((f, i) => {
                      const gem = GEMSTONE_TIERS.find((t) => t.tier === f.rating);
                      return (
                        <tr
                          key={`${f.studentEmail}-${f.tableId}-${i}`}
                          className="transition-colors hover:bg-slate-800/30"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-200">
                            {f.studentName}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {f.studentEmail}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md border border-slate-700/80 bg-slate-800/60 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                              {f.studentDepartment}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-blue-400">
                            {f.tableId}
                          </td>
                          <td className="px-4 py-3">
                            {gem ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-300">
                                <span>💎</span>
                                <span>{gem.name}</span>
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-300">{f.rating} ★</span>
                            )}
                          </td>
                          <td className="max-w-[280px] break-words px-4 py-3 text-slate-300">
                            {f.comment || <span className="text-slate-600">—</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-400">
                            {new Date(f.timestamp).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminRouteGuard>
  );
}
