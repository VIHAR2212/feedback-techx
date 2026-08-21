'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';

interface DashboardStats {
  totalUsers: number;
  totalFeedback: number;
  completedUsers: number;
  averageRating: number;
}

export default function AdminDashboardPage() {
  const { logout } = useAdmin();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFeedback: 0,
    completedUsers: 0,
    averageRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // The old dashboard is now part of /admin (Overview section) — bounce
  // anyone landing here straight to the consolidated admin page.
  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const statsResponse = await fetch('/api/feedback/stats');
      const statsData = await statsResponse.json();
      const leaderboardResponse = await fetch('/api/admin/leaderboard');
      const leaderboardData = await leaderboardResponse.json();
      const completedUsers = leaderboardData.filter(
        (u: { isCompleted: boolean }) => u.isCompleted
      ).length;
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalFeedback: statsData.totalFeedback || 0,
        completedUsers,
        averageRating: statsData.averageRating || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <AdminRouteGuard>
      <main className="min-h-screen bg-background px-4 py-8 text-foreground">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Uncharted Expedition · Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Dashboard</h1>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/admin"
                className="rounded border border-foreground/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Manage Labs
              </Link>
              <button
                onClick={handleLogout}
                className="rounded border border-foreground/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Logout
              </button>
            </div>
          </header>

          {isLoading ? (
            <p className="text-center text-xs">Loading dashboard…</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total explorers" value={stats.totalUsers} />
                <StatCard label="Total discoveries logged" value={stats.totalFeedback} />
                <StatCard label="Completed expeditions" value={stats.completedUsers} />
                <StatCard label="Average rating" value={stats.averageRating.toFixed(2)} />
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs">
                <button
                  onClick={() => router.push('/admin/leaderboard')}
                  className="rounded border-2 border-foreground bg-foreground px-4 py-2 text-background hover:opacity-90"
                >
                  View rankings
                </button>
                <button
                  onClick={() => router.push('/admin/feedback')}
                  className="rounded border border-foreground/40 px-4 py-2 hover:bg-muted"
                >
                  View all feedback
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </AdminRouteGuard>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border-2 border-foreground p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
