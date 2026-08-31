'use client';

import { useState, useEffect } from 'react';
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
        setFeedback(data);
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
      <main className="min-h-screen bg-background px-4 py-8 text-foreground">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Uncharted Expedition · Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Feedback Viewer</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
              <button
                onClick={exportFeedback}
                className="rounded border-2 border-foreground bg-foreground px-3 py-1.5 text-background hover:opacity-90"
              >
                Export CSV
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
              >
                Manage
              </button>
              <button
                onClick={() => router.push('/admin/leaderboard')}
                className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
              >
                Rankings
              </button>
              <button
                onClick={handleLogout}
                className="rounded border border-foreground/30 px-3 py-1.5 text-muted-foreground hover:bg-muted"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="mb-5 rounded border border-foreground/30 bg-muted/20 p-3 text-xs">
            <p className="mb-2 font-semibold">Filters</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">Email</span>
                <input
                  type="text"
                  placeholder="Filter by email"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  className="rounded border border-foreground/30 bg-background px-3 py-1.5 focus:border-foreground focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">Product ID</span>
                <input
                  type="text"
                  placeholder="Filter by product"
                  value={filters.productId}
                  onChange={(e) => handleFilterChange('productId', e.target.value)}
                  className="rounded border border-foreground/30 bg-background px-3 py-1.5 focus:border-foreground focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-muted-foreground">Department</span>
                <input
                  type="text"
                  placeholder="Filter by department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="rounded border border-foreground/30 bg-background px-3 py-1.5 focus:border-foreground focus:outline-none"
                />
              </label>
              <button
                onClick={clearFilters}
                className="self-end rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
              >
                Clear
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-xs">Loading feedback…</p>
          ) : error ? (
            <p className="rounded border border-dashed border-foreground/40 bg-muted/30 p-3 text-center text-xs">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-foreground/30 text-xs">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="border border-foreground/30 px-2 py-2 text-left">Name</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Email</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Department</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Product</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Gemstone</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Notes</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((f, i) => {
                    const gem = GEMSTONE_TIERS.find((t) => t.tier === f.rating);
                    return (
                      <tr key={`${f.studentEmail}-${f.tableId}-${i}`}>
                        <td className="border border-foreground/30 px-2 py-2">{f.studentName}</td>
                        <td className="border border-foreground/30 px-2 py-2">{f.studentEmail}</td>
                        <td className="border border-foreground/30 px-2 py-2">{f.studentDepartment}</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{f.tableId}</td>
                        <td className="border border-foreground/30 px-2 py-2">
                          {gem ? `${gem.name} (${gem.tier})` : f.rating}
                        </td>
                        <td className="max-w-[200px] border border-foreground/30 px-2 py-2 break-words">
                          {f.comment || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="border border-foreground/30 px-2 py-2">
                          {new Date(f.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {feedback.length === 0 && !isLoading && !error && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              No feedback matching the current filters.
            </p>
          )}
        </div>
      </main>
    </AdminRouteGuard>
  );
}
