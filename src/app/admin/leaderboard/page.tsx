'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';

interface LeaderboardEntry {
  name: string;
  email: string;
  department: string;
  completedProducts: string[];
  shards: string[];
  averageRating: number;
  isCompleted: boolean;
  completionDate?: string;
}

interface ProductStatsEntry {
  productId: string;
  productName: string;
  labName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalComments: number;
  lastRated: string | null;
}

export default function AdminLeaderboardPage() {
  const { logout } = useAdmin();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'products'>('users');

  useEffect(() => {
    fetchLeaderboard();
    fetchProductStats();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchProductStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data);
      setError('');
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      const response = await fetch('/api/admin/product-stats');
      if (!response.ok) throw new Error('Failed to fetch product stats');
      const data = await response.json();
      setProductStats(data);
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || entry.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(leaderboard.map((entry) => entry.department))];
  const filteredProductStats = productStats.filter((entry) => {
    const matchesSearch =
      entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.labName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || entry.labName === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <AdminRouteGuard>
      <main className="min-h-screen bg-background px-4 py-8 text-foreground">
        <div className="mx-auto max-w-5xl">
          <header className="mb-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Uncharted Expedition · Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Live Rankings</h1>
          </header>

          <div className="mb-4 flex justify-center text-xs">
            <div className="inline-flex rounded border border-foreground/30 bg-muted/30 p-0.5">
              <button
                onClick={() => setViewMode('users')}
                className={
                  'rounded px-3 py-1 ' + (viewMode === 'users' ? 'bg-foreground text-background' : '')
                }
              >
                Explorers
              </button>
              <button
                onClick={() => setViewMode('products')}
                className={
                  'rounded px-3 py-1 ' + (viewMode === 'products' ? 'bg-foreground text-background' : '')
                }
              >
                Discoveries
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-2 text-xs">
            <button
              onClick={() => {
                fetchLeaderboard();
                fetchProductStats();
              }}
              className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/admin/feedback')}
              className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
            >
              View feedback
            </button>
            <button
              onClick={handleLogout}
              className="rounded border border-foreground/30 px-3 py-1.5 text-muted-foreground hover:bg-muted"
            >
              Logout
            </button>
          </div>

          <div className="mb-5 flex flex-wrap items-end gap-3 rounded border border-foreground/30 bg-muted/20 p-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Search</span>
              <input
                type="text"
                placeholder="Name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded border border-foreground/30 bg-background px-3 py-1.5 focus:border-foreground focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Department</span>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="rounded border border-foreground/30 bg-background px-3 py-1.5 focus:border-foreground focus:outline-none"
              >
                <option value="">All</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="text-center text-xs">Loading…</p>
          ) : error ? (
            <p className="rounded border border-dashed border-foreground/40 bg-muted/30 p-3 text-center text-xs">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              {viewMode === 'users' ? (
                <table className="w-full border-collapse border border-foreground/30 text-xs">
                  <thead>
                    <tr className="bg-foreground text-background">
                      <th className="border border-foreground/30 px-2 py-2 text-left">Rank</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Name</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Department</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Discoveries</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Shards</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Avg</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Status</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboard.map((entry, i) => (
                      <tr key={entry.email}>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">#{i + 1}</td>
                        <td className="border border-foreground/30 px-2 py-2">{entry.name || '—'}</td>
                        <td className="border border-foreground/30 px-2 py-2">{entry.department}</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.completedProducts.length}</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.shards.length}/3</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.averageRating.toFixed(2)}</td>
                        <td className="border border-foreground/30 px-2 py-2">
                          {entry.isCompleted ? '✓ complete' : 'in progress'}
                        </td>
                        <td className="border border-foreground/30 px-2 py-2">
                          {entry.completionDate ? new Date(entry.completionDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse border border-foreground/30 text-xs">
                  <thead>
                    <tr className="bg-foreground text-background">
                      <th className="border border-foreground/30 px-2 py-2 text-left">Rank</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Discovery</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Checkpoint</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Ratings</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Avg</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Distribution</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Comments</th>
                      <th className="border border-foreground/30 px-2 py-2 text-left">Last rated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProductStats.length > 0 ? (
                      filteredProductStats.map((entry, i) => {
                        const dist = Object.entries(entry.ratingDistribution)
                          .filter(([, c]) => c > 0)
                          .map(([r, c]) => `${r}: ${c}`)
                          .join(' · ');
                        return (
                          <tr key={entry.productId}>
                            <td className="border border-foreground/30 px-2 py-2 font-mono">#{i + 1}</td>
                            <td className="border border-foreground/30 px-2 py-2">{entry.productName}</td>
                            <td className="border border-foreground/30 px-2 py-2">{entry.labName}</td>
                            <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.totalRatings}</td>
                            <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.averageRating.toFixed(2)}</td>
                            <td className="border border-foreground/30 px-2 py-2 text-[10px] text-muted-foreground">{dist || '—'}</td>
                            <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.totalComments}</td>
                            <td className="border border-foreground/30 px-2 py-2">
                              {entry.lastRated ? new Date(entry.lastRated).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="border border-foreground/30 px-2 py-3 text-center text-muted-foreground">
                          No discovery data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </AdminRouteGuard>
  );
}
