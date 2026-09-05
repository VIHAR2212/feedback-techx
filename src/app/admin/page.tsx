'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';
import { setLabsCache } from '@/lib/expeditionStore';
import { GEMSTONE_TIERS } from '@/lib/models';
import { csvCell } from '@/lib/utils';
import type { CheckpointNode, ExpeditionLab } from '@/lib/expeditionData';
import { generateRandomizedSafeLayout } from '@/lib/mapPlacement';

type SectorKey = '1' | '2' | '3';

const SECTORS: { key: SectorKey; label: string; chapter: string; color: string; badge: string }[] = [
  {
    key: '1',
    label: 'Sector 01',
    chapter: 'Chapter I',
    color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  {
    key: '2',
    label: 'Sector 02',
    chapter: 'Chapter II',
    color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  {
    key: '3',
    label: 'Sector 03',
    chapter: 'Chapter III',
    color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  },
];

// Helper to assign organic, collision-free slot coordinates within the left map page
function applySafeLayout(checkpoints: CheckpointNode[], seed?: number): CheckpointNode[] {
  const slots = generateRandomizedSafeLayout(checkpoints.length, seed);
  return checkpoints.map((cp, i) => ({
    ...cp,
    x: slots[i]?.x ?? cp.x,
    y: slots[i]?.y ?? cp.y,
  }));
}

export default function AdminPage() {
  return (
    <AdminRouteGuard>
      <AdminContent />
    </AdminRouteGuard>
  );
}

function AdminContent() {
  const { logout } = useAdmin();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'feedback'>('overview');

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-600/30">
      {/* Top clean header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-bold text-white shadow-md shadow-blue-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                  TechX Expedition
                </p>
              </div>
              <h1 className="text-base font-bold tracking-tight text-white">
                Admin Control Center
              </h1>
            </div>
          </div>

          {/* Quick tab switcher & external actions */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center rounded-xl border border-slate-800 bg-slate-900/80 p-1 sm:flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  activeTab === 'products'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lab Products
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  activeTab === 'feedback'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Feedback
              </button>
            </div>

            <Link
              href="/admin/leaderboard"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <span>🏆</span>
              <span className="hidden sm:inline">Rankings</span>
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Mobile Tab Switcher */}
        <div className="mb-6 flex rounded-xl border border-slate-800 bg-slate-900/80 p-1 sm:hidden">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition ${
              activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-medium transition ${
              activeTab === 'feedback' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Feedback
          </button>
        </div>

        {/* Dynamic section display */}
        {activeTab === 'overview' && (
          <div>
            <OverviewSection onNavigateToProducts={() => setActiveTab('products')} onNavigateToFeedback={() => setActiveTab('feedback')} />
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <ProductsSection />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <FeedbackSection />
          </div>
        )}

        <footer className="mt-20 border-t border-slate-800/80 pt-6 pb-12 text-center text-xs text-slate-500">
          TechX Portal · System Administration Dashboard
        </footer>
      </main>
    </div>
  );
}

/* ============================== Overview ============================== */

function OverviewSection({
  onNavigateToProducts,
  onNavigateToFeedback,
}: {
  onNavigateToProducts: () => void;
  onNavigateToFeedback: () => void;
}) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFeedback: 0,
    completedUsers: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await fetch('/api/admin/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const data = await res.json();
      setStats({
        totalUsers: data.stats?.totalUsers || 0,
        totalFeedback: data.stats?.totalFeedback || 0,
        completedUsers: data.stats?.completedUsers || 0,
        averageRating: data.stats?.averageRating || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Could not load the latest stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    {
      label: 'Explorers Enrolled',
      value: String(stats.totalUsers),
      icon: '👥',
      color: 'from-blue-500/10 to-indigo-500/5 text-blue-400 border-blue-500/20',
      caption: 'Unique student sessions recorded',
    },
    {
      label: 'Feedback Entries',
      value: String(stats.totalFeedback),
      icon: '💬',
      color: 'from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20',
      caption: 'Total reviews submitted across products',
    },
    {
      label: 'Expeditions Completed',
      value: String(stats.completedUsers),
      icon: '🏆',
      color: 'from-amber-500/10 to-orange-500/5 text-amber-400 border-amber-500/20',
      caption: 'Students who earned all 3 shards',
    },
    {
      label: 'Average Score',
      value: stats.averageRating > 0 ? `${stats.averageRating.toFixed(2)} / 5.0` : '—',
      icon: '⭐',
      color: 'from-purple-500/10 to-pink-500/5 text-purple-400 border-purple-500/20',
      caption: 'Average rating across all entries',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Live Operations Summary</h2>
          <p className="text-xs text-slate-400">
            Real-time analytics on student participation and review submissions
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          <span>⟳</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 py-20">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="mt-3 text-xs text-slate-400">Retrieving system statistics…</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
          <span>{error}</span>
          <button
            onClick={load}
            className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div
                key={c.label}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b p-5 shadow-lg backdrop-blur-sm ${c.color} bg-slate-900/60`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {c.label}
                  </span>
                  <span className="text-xl">{c.icon}</span>
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight text-white">
                  {c.value}
                </div>
                <p className="mt-2 text-xs text-slate-400">{c.caption}</p>
              </div>
            ))}
          </div>

          {/* Quick Access Action Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
                  🗺️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sector & Product Configuration</h3>
                  <p className="text-xs text-slate-400">
                    Add, edit, or reorder table waypoints across the 3 chapters
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onNavigateToProducts}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-500"
                >
                  Manage Products →
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-xl text-emerald-400">
                  📊
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Student Feedback & Ratings</h3>
                  <p className="text-xs text-slate-400">
                    Inspect all individual student reviews, filter, and export CSV
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onNavigateToFeedback}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-500"
                >
                  View All Feedback →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ Lab Products ============================ */

function ProductsSection() {
  const [labs, setLabs] = useState<Record<string, ExpeditionLab>>({});
  const [activeSector, setActiveSector] = useState<SectorKey>('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/labs');
      if (!res.ok) throw new Error('Failed to load labs');
      const data = await res.json();
      setLabs((data?.labs ?? {}) as Record<string, ExpeditionLab>);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load labs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLabMeta = (sector: SectorKey, field: keyof ExpeditionLab, value: string) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      return { ...prev, [sector]: { ...current, [field]: value } };
    });
    setStatus(null);
  };

  const updateCheckpoint = (
    sector: SectorKey,
    index: number,
    field: keyof CheckpointNode,
    value: string | number
  ) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const checkpoints = current.checkpoints.map((cp, i) =>
        i === index ? { ...cp, [field]: value } : cp
      );
      return { ...prev, [sector]: { ...current, checkpoints } };
    });
    setStatus(null);
  };

  const moveCheckpoint = (sector: SectorKey, index: number, direction: -1 | 1) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const checkpoints = [...current.checkpoints];
      const target = index + direction;
      if (target < 0 || target >= checkpoints.length) return prev;
      [checkpoints[index], checkpoints[target]] = [checkpoints[target], checkpoints[index]];
      const reordered = applySafeLayout(checkpoints);
      return { ...prev, [sector]: { ...current, checkpoints: reordered } };
    });
    setStatus(null);
  };

  const addCheckpoint = (sector: SectorKey) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      if (current.checkpoints.length >= 10) {
        alert('Maximum 10 products allowed per sector.');
        return prev;
      }
      const newCp: CheckpointNode = {
        id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: 'New Product',
        description: '',
        icon: '📦',
        x: 50,
        y: 50,
      };
      const updated = [...current.checkpoints, newCp];
      const checkpoints = applySafeLayout(updated);
      return {
        ...prev,
        [sector]: { ...current, checkpoints },
      };
    });
    setStatus(null);
  };

  const autoArrange = (sector: SectorKey) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const checkpoints = applySafeLayout(current.checkpoints, parseInt(sector, 10) * 100);
      return { ...prev, [sector]: { ...current, checkpoints } };
    });
    setStatus(null);
  };

  const randomizeLayout = (sector: SectorKey) => {
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const checkpoints = applySafeLayout(current.checkpoints);
      return { ...prev, [sector]: { ...current, checkpoints } };
    });
    setStatus(null);
  };

  const deleteCheckpoint = (sector: SectorKey, index: number) => {
    if (!window.confirm('Delete this product waypoint?')) return;
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const remaining = current.checkpoints.filter((_, i) => i !== index);
      const checkpoints = applySafeLayout(remaining);
      return { ...prev, [sector]: { ...current, checkpoints } };
    });
    setStatus(null);
  };

  const moveToLab = (sector: SectorKey, index: number, targetSector: SectorKey) => {
    if (targetSector === sector) return;
    setLabs((prev) => {
      const current = prev[sector];
      const target = prev[targetSector];
      if (!current || !target) return prev;
      if (target.checkpoints.length >= 10) {
        alert(`Target ${target.name || `Sector ${targetSector}`} already has the maximum of 10 products.`);
        return prev;
      }
      const moved = current.checkpoints[index];
      const sourceRemaining = current.checkpoints.filter((_, i) => i !== index);
      const targetUpdated = [...target.checkpoints, moved];

      const sourceCheckpoints = applySafeLayout(sourceRemaining);
      const targetCheckpoints = applySafeLayout(targetUpdated);

      return {
        ...prev,
        [sector]: {
          ...current,
          checkpoints: sourceCheckpoints,
        },
        [targetSector]: {
          ...target,
          checkpoints: targetCheckpoints,
        },
      };
    });
    setStatus(null);
  };

  const save = async () => {
    setStatus('Saving changes…');
    try {
      const res = await fetch('/api/admin/labs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labs }),
      });
      if (!res.ok) throw new Error('Failed to save labs');
      const data = await res.json();
      const saved = (data?.labs ?? labs) as Record<string, ExpeditionLab>;
      setLabs(saved);
      setLabsCache(saved);
      setStatus('Saved successfully ✓');
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(e instanceof Error ? `Error: ${e.message}` : 'Error: Failed to save');
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset all sectors and products to factory defaults? This cannot be undone.')) return;
    setStatus('Resetting to defaults…');
    try {
      const res = await fetch('/api/admin/labs', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reset labs');
      const data = await res.json();
      setLabs((data?.labs ?? {}) as Record<string, ExpeditionLab>);
      setLabsCache((data?.labs ?? {}) as Record<string, ExpeditionLab>);
      setStatus('Reset to defaults complete ✓');
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(e instanceof Error ? `Error: ${e.message}` : 'Error: Failed to reset');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 py-20">
        <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="mt-3 text-xs text-slate-400">Loading sector products…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
        <span>{error}</span>
        <button
          onClick={load}
          className="rounded-xl bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentLab = labs[activeSector];

  return (
    <div className="space-y-6 pb-24">
      {/* Title & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Lab Products & Waypoints</h2>
          <p className="text-xs text-slate-400">
            Configure metadata and interactive products for each expedition sector
          </p>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {SECTORS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSector(s.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeSector === s.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{s.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  activeSector === s.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {labs[s.key]?.checkpoints.length || 0}/10
              </span>
            </button>
          ))}
        </div>
      </div>

      {currentLab && (
        <div className="space-y-6">
          {/* Sector Metadata Card */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {SECTORS.find((s) => s.key === activeSector)?.label} Settings
                </h3>
              </div>
              <span className="text-xs text-slate-400">{currentLab.chapterNumber}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ModernField
                label="Lab / Sector Name"
                value={currentLab.name}
                onChange={(v) => updateLabMeta(activeSector, 'name', v)}
                placeholder="e.g. Portolan Charts"
              />
              <ModernField
                label="Chapter Number"
                value={currentLab.chapterNumber}
                onChange={(v) => updateLabMeta(activeSector, 'chapterNumber', v)}
                placeholder="e.g. Chapter I"
              />
              <ModernField
                label="Main Title"
                value={currentLab.title}
                onChange={(v) => updateLabMeta(activeSector, 'title', v)}
                placeholder="e.g. Charting the Uncharted"
              />
              <ModernField
                label="Subtitle Description"
                value={currentLab.subtitle}
                onChange={(v) => updateLabMeta(activeSector, 'subtitle', v)}
                placeholder="Short descriptive overview"
              />
              <ModernField
                label="Reward Badge Title"
                value={currentLab.badgeTitle}
                onChange={(v) => updateLabMeta(activeSector, 'badgeTitle', v)}
                placeholder="e.g. Cartographer's Badge"
              />
              <ModernField
                label="Fragment Shard Name"
                value={currentLab.fragmentName ?? ''}
                onChange={(v) => updateLabMeta(activeSector, 'fragmentName', v)}
                placeholder="e.g. Map Fragment"
              />
            </div>
          </div>

          {/* Products Waypoint List */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Waypoints ({currentLab.checkpoints.length} / 10)
                </h3>
                <p className="text-xs text-slate-400">
                  Products displayed on the explorer map in this sector
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => randomizeLayout(activeSector)}
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  title="Generate organic, non-overlapping coordinates"
                >
                  ⚄ Randomize Map Layout
                </button>
                <button
                  onClick={() => autoArrange(activeSector)}
                  className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  title="Align waypoints along an aesthetic route"
                >
                  Auto-Arrange Trail
                </button>
                <button
                  onClick={() => addCheckpoint(activeSector)}
                  disabled={currentLab.checkpoints.length >= 10}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>+</span>
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[840px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-3.5 py-3 font-semibold">#</th>
                    <th className="px-3.5 py-3 font-semibold">Product Name</th>
                    <th className="px-3.5 py-3 font-semibold">Description</th>
                    <th className="px-3.5 py-3 font-semibold text-center">Icon</th>
                    <th className="px-3.5 py-3 font-semibold text-center">X %</th>
                    <th className="px-3.5 py-3 font-semibold text-center">Y %</th>
                    <th className="px-3.5 py-3 font-semibold">Move To</th>
                    <th className="px-3.5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {currentLab.checkpoints.map((cp, i) => (
                    <tr key={cp.id} className="transition-colors hover:bg-slate-800/25">
                      <td className="px-3.5 py-3 font-mono font-medium text-slate-500">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3.5 py-3">
                        <input
                          value={cp.name}
                          onChange={(e) => updateCheckpoint(activeSector, i, 'name', e.target.value)}
                          className="w-40 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3.5 py-3">
                        <textarea
                          value={cp.description}
                          onChange={(e) => updateCheckpoint(activeSector, i, 'description', e.target.value)}
                          rows={2}
                          className="w-56 resize-y rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <input
                          value={cp.icon}
                          onChange={(e) => updateCheckpoint(activeSector, i, 'icon', e.target.value)}
                          className="w-12 rounded-lg border border-slate-700/80 bg-slate-950/60 px-1.5 py-1.5 text-center text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <input
                          type="number"
                          value={cp.x}
                          onChange={(e) => updateCheckpoint(activeSector, i, 'x', Number(e.target.value) || 0)}
                          className="w-16 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-1.5 text-center font-mono text-xs text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <input
                          type="number"
                          value={cp.y}
                          onChange={(e) => updateCheckpoint(activeSector, i, 'y', Number(e.target.value) || 0)}
                          className="w-16 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-1.5 text-center font-mono text-xs text-slate-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3.5 py-3">
                        <select
                          value=""
                          onChange={(e) => moveToLab(activeSector, i, e.target.value as SectorKey)}
                          className="rounded-lg border border-slate-700/80 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-300 outline-none transition focus:border-blue-500"
                        >
                          <option value="" disabled>
                            Move to…
                          </option>
                          {SECTORS.filter((s) => s.key !== activeSector).map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => moveCheckpoint(activeSector, i, -1)}
                            disabled={i === 0}
                            className="rounded-lg border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveCheckpoint(activeSector, i, 1)}
                            disabled={i === currentLab.checkpoints.length - 1}
                            className="rounded-lg border border-slate-700/80 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                            title="Move Down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => deleteCheckpoint(activeSector, i)}
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-500/20"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentLab.checkpoints.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No products added to this sector yet. Click &quot;Add Product&quot; to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <p className="text-xs font-medium text-slate-300">
              {status ?? 'Unsaved edits are stored locally in your session'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={reset}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Reset Defaults
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              <span>💾</span>
              <span>Save & Publish Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Feedback ============================== */

interface FeedbackEntry {
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  rating: number;
  comment: string;
  tableId: string;
  timestamp: string;
}

function FeedbackSection() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ email: '', productId: '', department: '' });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedFilters.email) params.append('email', debouncedFilters.email);
      if (debouncedFilters.productId) params.append('productId', debouncedFilters.productId);
      if (debouncedFilters.department) params.append('department', debouncedFilters.department);
      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch feedback');
      const data = await response.json();
      setFeedback(Array.isArray(data) ? data : data.items || []);
      setError('');
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
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
        return [f.studentName, f.studentEmail, f.studentDepartment, f.tableId, gem, f.comment, f.timestamp];
      }),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techx-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Student Review Ledger</h2>
          <p className="text-xs text-slate-400">
            Search, filter, and inspect student evaluations
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportFeedback}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-500"
          >
            <span>⤓</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Search Filters
          </h3>
          {(filters.email || filters.productId || filters.department) && (
            <button
              onClick={clearFilters}
              className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FilterInput
            label="Email Address"
            placeholder="Search by student email…"
            value={filters.email}
            onChange={(v) => handleFilterChange('email', v)}
          />
          <FilterInput
            label="Product / Table ID"
            placeholder="e.g. A1, B4…"
            value={filters.productId}
            onChange={(v) => handleFilterChange('productId', v)}
          />
          <FilterInput
            label="Department"
            placeholder="e.g. AI-DS, CSE…"
            value={filters.department}
            onChange={(v) => handleFilterChange('department', v)}
          />
        </div>
      </div>

      {/* Table Data */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-900/40 py-16">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="mt-3 text-xs text-slate-400">Loading reviews…</p>
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
                      <td className="px-4 py-3 text-slate-400">{f.studentEmail}</td>
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
  );
}

/* ============================== Form Atoms ============================== */

function ModernField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

function FilterInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}
