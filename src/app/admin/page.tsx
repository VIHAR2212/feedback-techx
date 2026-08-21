'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';
import AdminRouteGuard from '@/components/uncharted/AdminRouteGuard';
import { setLabsCache } from '@/lib/expeditionStore';
import { GEMSTONE_TIERS } from '@/lib/models';
import type { CheckpointNode, ExpeditionLab } from '@/lib/expeditionData';
import { generateRandomizedSafeLayout } from '@/lib/mapPlacement';

type SectorKey = '1' | '2' | '3';

const SECTORS: { key: SectorKey; label: string; accent: string; chip: string; bar: string }[] = [
  {
    key: '1',
    label: 'Sector 01',
    accent: 'text-amber-700',
    chip: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
  },
  {
    key: '2',
    label: 'Sector 02',
    accent: 'text-teal-700',
    chip: 'bg-teal-100 text-teal-800',
    bar: 'bg-teal-500',
  },
  {
    key: '3',
    label: 'Sector 03',
    accent: 'text-violet-700',
    chip: 'bg-violet-100 text-violet-800',
    bar: 'bg-violet-500',
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

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              Uncharted Expedition · Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Manage</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/leaderboard"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Leaderboard →
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
          <NavLink href="#overview">Overview</NavLink>
          <NavLink href="#products">Lab Products</NavLink>
          <NavLink href="#feedback">Feedback</NavLink>
        </nav>

        <OverviewSection />
        <ProductsSection />
        <FeedbackSection />
      </div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
    >
      {children}
    </a>
  );
}

function SectionHeader({
  id,
  title,
  subtitle,
}: {
  id?: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 pt-2">
      <h2 className="text-lg font-bold tracking-tight text-zinc-800">{title}</h2>
      <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

function OverviewSection() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFeedback: 0,
    completedUsers: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const statsRes = await fetch('/api/feedback/stats');
      const statsData = await statsRes.json();
      const boardRes = await fetch('/api/admin/leaderboard');
      const boardData = await boardRes.json();
      const completedUsers = boardData.filter((u: { isCompleted: boolean }) => u.isCompleted).length;
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalFeedback: statsData.totalFeedback || 0,
        completedUsers,
        averageRating: statsData.averageRating || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: 'Total explorers', value: stats.totalUsers, icon: '🧭' },
    { label: 'Total discoveries logged', value: stats.totalFeedback, icon: '📜' },
    { label: 'Completed explorers', value: stats.completedUsers, icon: '🏆' },
    { label: 'Average rating', value: stats.averageRating.toFixed(1), icon: '💎' },
  ];

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between">
        <SectionHeader title="Overview" subtitle="Live summary of exploration activity." />
        <button
          onClick={load}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{c.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{c.label}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductsSection() {
  const [labs, setLabs] = useState<Record<string, ExpeditionLab>>({});
  const [collapsed, setCollapsed] = useState<Record<SectorKey, boolean>>({
    '1': false,
    '2': false,
    '3': false,
  });
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
      // Re-assign slot coordinates so order strictly matches the visual trail sequence
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
        name: 'New product',
        description: '',
        icon: '📦',
        x: 50,
        y: 50,
      };
      const updated = [...current.checkpoints, newCp];
      // Automatically relocate all existing and new nodes with optimal spacing inside the left page
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
    setLabs((prev) => {
      const current = prev[sector];
      if (!current) return prev;
      const remaining = current.checkpoints.filter((_, i) => i !== index);
      // Smoothly re-space remaining nodes
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

  const toggleSector = (sector: SectorKey) => {
    setCollapsed((prev) => ({ ...prev, [sector]: !prev[sector] }));
  };

  const save = async () => {
    setStatus('Saving…');
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
      setStatus('Saved ✓');
    } catch (e) {
      setStatus(e instanceof Error ? `Error: ${e.message}` : 'Error: Failed to save');
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset all labs to the default products? This cannot be undone.')) return;
    setStatus('Resetting…');
    try {
      const res = await fetch('/api/admin/labs', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reset labs');
      const data = await res.json();
      setLabs((data?.labs ?? {}) as Record<string, ExpeditionLab>);
      setLabsCache((data?.labs ?? {}) as Record<string, ExpeditionLab>);
      setStatus('Reset to defaults ✓');
    } catch (e) {
      setStatus(e instanceof Error ? `Error: ${e.message}` : 'Error: Failed to reset');
    }
  };

  if (loading) {
    return (
      <section className="mb-10">
        <SectionHeader title="Lab Products" subtitle="The 3 journal sectors shown to explorers." />
        <p className="py-16 text-center text-sm text-zinc-500">Loading…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-10">
        <SectionHeader title="Lab Products" subtitle="The 3 journal sectors shown to explorers." />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="mb-3 font-medium">{error}</p>
          <button
            onClick={load}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="mb-10 scroll-mt-24">
      <div className="mb-6">
        <SectionHeader title="Lab Products" subtitle="The 3 journal sectors shown to explorers." />
      </div>

      <div className="space-y-8 pb-28">
        {SECTORS.map((sector) => {
          const lab = labs[sector.key];
          if (!lab) return null;
          const isCollapsed = !!collapsed[sector.key];
          return (
            <section
              key={sector.key}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className={`h-1.5 ${sector.bar}`} />

              <div className="flex flex-wrap items-center gap-3 p-6">
                <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${sector.chip}`}>
                  {sector.label}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-zinc-800">{lab.name}</h2>
                  <p className="text-sm text-zinc-500">
                    Chapter {lab.chapterNumber} · {lab.checkpoints.length} products
                  </p>
                </div>
                <button
                  onClick={() => toggleSector(sector.key)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  {isCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>

              {!isCollapsed && (
                <>
                  <div className="border-t border-zinc-100 p-6">
                    <h3 className={`mb-4 text-xs font-bold uppercase tracking-[0.2em] ${sector.accent}`}>
                      Lab details
                    </h3>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="Lab name"
                        value={lab.name}
                        onChange={(v) => updateLabMeta(sector.key, 'name', v)}
                        placeholder="e.g. Portolan Charts"
                      />
                      <Field
                        label="Chapter"
                        value={lab.chapterNumber}
                        onChange={(v) => updateLabMeta(sector.key, 'chapterNumber', v)}
                        placeholder="e.g. 07"
                      />
                      <Field
                        label="Title"
                        value={lab.title}
                        onChange={(v) => updateLabMeta(sector.key, 'title', v)}
                        placeholder="e.g. Charting the Uncharted"
                      />
                      <Field
                        label="Subtitle"
                        value={lab.subtitle}
                        onChange={(v) => updateLabMeta(sector.key, 'subtitle', v)}
                        placeholder="Short description"
                      />
                      <Field
                        label="Badge title"
                        value={lab.badgeTitle}
                        onChange={(v) => updateLabMeta(sector.key, 'badgeTitle', v)}
                        placeholder="e.g. Cartographer's Badge"
                      />
                      <Field
                        label="Fragment name"
                        value={lab.fragmentName ?? ''}
                        onChange={(v) => updateLabMeta(sector.key, 'fragmentName', v)}
                        placeholder="e.g. Map Fragment"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${sector.accent}`}>
                          Products
                        </h3>
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-600">
                          {lab.checkpoints.length}/10
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => randomizeLayout(sector.key)}
                          className="rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100/80 cursor-pointer shadow-xs"
                          title="Generate a fresh, organic randomized node placement with safe margins"
                        >
                          🎲 Randomize placement
                        </button>
                        <button
                          onClick={() => autoArrange(sector.key)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                          title="Spread all products along an aesthetic winding trail across the map"
                        >
                          Auto-arrange route
                        </button>
                        <button
                          onClick={() => addCheckpoint(sector.key)}
                          disabled={lab.checkpoints.length >= 10}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title={lab.checkpoints.length >= 10 ? 'Maximum 10 products per sector' : 'Add new product'}
                        >
                          {lab.checkpoints.length >= 10 ? '+ Add product (Max 10)' : '+ Add product'}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-200">
                      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                            <th className="px-3 py-3 font-semibold">#</th>
                            <th className="px-3 py-3 font-semibold">Name</th>
                            <th className="px-3 py-3 font-semibold">Description</th>
                            <th className="px-3 py-3 font-semibold">Icon</th>
                            <th className="px-3 py-3 font-semibold">X %</th>
                            <th className="px-3 py-3 font-semibold">Y %</th>
                            <th className="px-3 py-3 font-semibold">Move to</th>
                            <th className="px-3 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lab.checkpoints.map((cp, i) => (
                            <tr key={cp.id} className="border-t border-zinc-100 align-top">
                              <td className="px-3 py-3 text-zinc-400">{i + 1}</td>
                              <td className="px-3 py-3">
                                <input
                                  value={cp.name}
                                  onChange={(e) =>
                                    updateCheckpoint(sector.key, i, 'name', e.target.value)
                                  }
                                  className="w-36 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <textarea
                                  value={cp.description}
                                  onChange={(e) =>
                                    updateCheckpoint(sector.key, i, 'description', e.target.value)
                                  }
                                  rows={2}
                                  className="w-56 resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  value={cp.icon}
                                  onChange={(e) =>
                                    updateCheckpoint(sector.key, i, 'icon', e.target.value)
                                  }
                                  className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  value={cp.x}
                                  onChange={(e) =>
                                    updateCheckpoint(sector.key, i, 'x', Number(e.target.value) || 0)
                                  }
                                  className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  type="number"
                                  value={cp.y}
                                  onChange={(e) =>
                                    updateCheckpoint(sector.key, i, 'y', Number(e.target.value) || 0)
                                  }
                                  className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value=""
                                  onChange={(e) =>
                                    moveToLab(sector.key, i, e.target.value as SectorKey)
                                  }
                                  className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="" disabled>
                                    Choose…
                                  </option>
                                  {SECTORS.filter((s) => s.key !== sector.key).map((s) => (
                                    <option key={s.key} value={s.key}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <IconBtn
                                    onClick={() => moveCheckpoint(sector.key, i, -1)}
                                    disabled={i === 0}
                                    title="Move up"
                                  >
                                    ↑
                                  </IconBtn>
                                  <IconBtn
                                    onClick={() => moveCheckpoint(sector.key, i, 1)}
                                    disabled={i === lab.checkpoints.length - 1}
                                    title="Move down"
                                  >
                                    ↓
                                  </IconBtn>
                                  <button
                                    onClick={() => deleteCheckpoint(sector.key, i)}
                                    className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {lab.checkpoints.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-3 py-8 text-center text-sm text-zinc-400">
                                No products in this sector yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-zinc-600">
              {status ?? 'Changes are applied to the site after saving.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Reset to defaults
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.email) params.append('email', filters.email);
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.department) params.append('department', filters.department);
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
  }, [filters.email, filters.productId, filters.department]);

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
        return [
          f.studentName,
          f.studentEmail,
          f.studentDepartment,
          f.tableId,
          gem,
          f.comment.replace(/,/g, ';'),
          f.timestamp,
        ];
      }),
    ]
      .map((row) => row.join(','))
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
    <section id="feedback" className="mb-10 scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          title="Feedback"
          subtitle="Every discovery note logged by explorers."
        />
        <div className="flex gap-2">
          <button
            onClick={exportFeedback}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Filters</p>
        <div className="flex flex-wrap items-end gap-3">
          <FilterInput
            label="Email"
            placeholder="Filter by email"
            value={filters.email}
            onChange={(v) => handleFilterChange('email', v)}
          />
          <FilterInput
            label="Product ID"
            placeholder="Filter by product"
            value={filters.productId}
            onChange={(v) => handleFilterChange('productId', v)}
          />
          <FilterInput
            label="Department"
            placeholder="Filter by department"
            value={filters.department}
            onChange={(v) => handleFilterChange('department', v)}
          />
          <button
            onClick={clearFilters}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Clear
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : feedback.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          No feedback matching the current filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Department</th>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Gemstone</th>
                <th className="px-3 py-3 font-semibold">Notes</th>
                <th className="px-3 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f, i) => {
                const gem = GEMSTONE_TIERS.find((t) => t.tier === f.rating);
                return (
                  <tr key={`${f.studentEmail}-${f.tableId}-${i}`} className="border-t border-zinc-100 align-top">
                    <td className="px-3 py-3 font-medium text-zinc-800">{f.studentName}</td>
                    <td className="px-3 py-3 text-zinc-600">{f.studentEmail}</td>
                    <td className="px-3 py-3 text-zinc-600">{f.studentDepartment}</td>
                    <td className="px-3 py-3 font-mono text-xs text-zinc-600">{f.tableId}</td>
                    <td className="px-3 py-3">
                      {gem ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {gem.name} ({gem.tier})
                        </span>
                      ) : (
                        f.rating
                      )}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 break-words text-zinc-600">
                      {f.comment || <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-zinc-600">
                      {new Date(f.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-zinc-500">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-48 rounded-md border border-zinc-300 px-2.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 px-2.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function IconBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}