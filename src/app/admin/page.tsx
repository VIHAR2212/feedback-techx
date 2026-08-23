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

const SECTORS: { key: SectorKey; label: string; chapter: string; accent: string; dot: string; edge: string }[] = [
  {
    key: '1',
    label: 'Sector 01',
    chapter: 'Chapter I',
    accent: 'text-[#d9a441]',
    dot: 'bg-[#d9a441]',
    edge: 'border-l-[#d9a441]',
  },
  {
    key: '2',
    label: 'Sector 02',
    chapter: 'Chapter II',
    accent: 'text-[#8fbca4]',
    dot: 'bg-[#8fbca4]',
    edge: 'border-l-[#8fbca4]',
  },
  {
    key: '3',
    label: 'Sector 03',
    chapter: 'Chapter III',
    accent: 'text-[#c96f43]',
    dot: 'bg-[#c96f43]',
    edge: 'border-l-[#c96f43]',
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
    <div className="min-h-screen bg-[#14100b] text-[#ece0c4] selection:bg-[#c9a227]/30">
      {/* Sticky field-office top bar */}
      <header className="sticky top-0 z-30 border-b border-[#35291a] bg-[#171209]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c9a227]/40 bg-[#241b0e] text-sm" aria-hidden>
              🧭
            </span>
            <div className="min-w-0 leading-tight">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#a3906b]">
                TechX Expedition
              </p>
              <h1
                className="truncate text-sm font-bold tracking-wide text-[#efe3c2]"
                style={{ fontFamily: 'var(--font-cinzel), serif' }}
              >
                Field Office
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/leaderboard"
              className="rounded border border-[#3d2f1c] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#cbb98d] transition hover:border-[#c9a227]/60 hover:text-[#efe3c2]"
            >
              Rankings
            </Link>
            <button
              onClick={handleLogout}
              className="rounded border border-[#3d2f1c] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a3906b] transition hover:border-[#8b3a2e] hover:text-[#e0a497]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Section index — editorial contents strip */}
        <nav className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-dashed border-[#35291a] pb-4 font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="text-[#6e5c3f]">Index —</span>
          <SectionLink href="#overview" n="01" label="Overview" />
          <SectionLink href="#products" n="02" label="Lab Products" />
          <SectionLink href="#feedback" n="03" label="Feedback" />
        </nav>

        <OverviewSection />
        <ProductsSection />
        <FeedbackSection />

        <footer className="mt-16 border-t border-dashed border-[#35291a] pt-4 pb-8 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[#6e5c3f]">
          Sic Parvis Magna · Field Office v2
        </footer>
      </main>
    </div>
  );
}

function SectionLink({ href, n, label }: { href: string; n: string; label: string }) {
  return (
    <a href={href} className="group inline-flex items-center gap-1.5 text-[#a3906b] transition hover:text-[#efe3c2]">
      <span className="text-[#c9a227]/70">{n}</span>
      <span>{label}</span>
      <span className="inline-block h-px w-0 bg-[#c9a227] transition-all duration-200 group-hover:w-3" aria-hidden />
    </a>
  );
}

function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div id={id} className="scroll-mt-20 pt-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-[#c9a227]/80">{eyebrow}</p>
      <h2
        className="mt-1 text-xl font-bold tracking-wide text-[#efe3c2]"
        style={{ fontFamily: 'var(--font-cinzel), serif' }}
      >
        {title}
      </h2>
      <p className="mt-0.5 text-[13px] text-[#a3906b]">{subtitle}</p>
    </div>
  );
}

/* ============================== Overview ============================== */

function OverviewSection() {
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
      const statsRes = await fetch('/api/feedback/stats');
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      const boardRes = await fetch('/api/admin/leaderboard');
      if (!boardRes.ok) throw new Error('Failed to fetch leaderboard');
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
      setError('Could not load the latest stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: 'Explorers enrolled', value: String(stats.totalUsers), icon: '🧭', caption: 'unique student sessions' },
    { label: 'Discoveries logged', value: String(stats.totalFeedback), icon: '📜', caption: 'feedback entries recorded' },
    { label: 'Expeditions complete', value: String(stats.completedUsers), icon: '🏆', caption: 'all three shards earned' },
    { label: 'Mean gemstone', value: stats.averageRating.toFixed(2), icon: '💎', caption: 'average rating / 5.00' },
  ];

  return (
    <section className="mb-14">
      <div className="mb-4 flex items-end justify-between gap-3">
        <SectionHeader
          eyebrow="01 · Situation Report"
          title="Overview"
          subtitle="Live summary of exploration activity."
        />
        <button
          onClick={load}
          className="shrink-0 rounded border border-[#3d2f1c] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#cbb98d] transition hover:border-[#c9a227]/60 hover:text-[#efe3c2]"
        >
          Refresh ⟳
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#6e5c3f]">
          Consulting the ledger…
        </p>
      ) : error ? (
        <div className="rounded border border-[#5c2620] bg-[#241512] p-4 text-sm text-[#e0a497]">
          {error}
          <button
            onClick={load}
            className="ml-3 rounded border border-[#5c2620] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#e0a497] transition hover:bg-[#33201a]"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-md border border-[#35291a] bg-[#35291a] sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-[#1c1610] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#a3906b]">
                  {c.label}
                </span>
                <span className="text-base opacity-80" aria-hidden>
                  {c.icon}
                </span>
              </div>
              <div
                className="mt-4 text-4xl font-bold leading-none text-[#efe3c2]"
                style={{ fontFamily: 'var(--font-uncharted-title), sans-serif' }}
              >
                {c.value}
              </div>
              <div className="mt-2 border-t border-dashed border-[#35291a] pt-2 text-[11px] text-[#8a7752]">
                {c.caption}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================ Lab Products ============================ */

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
      <section className="mb-14">
        <SectionHeader eyebrow="02 · Cartography" title="Lab Products" subtitle="The three journal sectors shown to explorers." />
        <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#6e5c3f]">
          Unrolling the maps…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-14">
        <SectionHeader eyebrow="02 · Cartography" title="Lab Products" subtitle="The three journal sectors shown to explorers." />
        <div className="rounded border border-[#5c2620] bg-[#241512] p-4 text-sm text-[#e0a497]">
          <p className="mb-3">{error}</p>
          <button
            onClick={load}
            className="rounded border border-[#5c2620] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#e0a497] transition hover:bg-[#33201a]"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="mb-14 scroll-mt-20">
      <SectionHeader eyebrow="02 · Cartography" title="Lab Products" subtitle="The three journal sectors shown to explorers." />

      <div className="space-y-6 pb-28 pt-6">
        {SECTORS.map((sector) => {
          const lab = labs[sector.key];
          if (!lab) return null;
          const isCollapsed = !!collapsed[sector.key];
          return (
            <article
              key={sector.key}
              className={`overflow-hidden rounded-md border border-[#35291a] border-l-2 bg-[#1c1610] ${sector.edge}`}
            >
              {/* Sector header */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <button
                  onClick={() => toggleSector(sector.key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sector.dot}`} aria-hidden />
                  <span className={`shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.22em] ${sector.accent}`}>
                    {sector.label}
                  </span>
                  <span className="min-w-0 truncate text-sm text-[#efe3c2]">{lab.name}</span>
                  <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8a7752] sm:inline">
                    {lab.chapterNumber} · {lab.checkpoints.length}/10 products
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-[#8a7752]">
                    [{isCollapsed ? '+' : '–'}]
                  </span>
                </button>
              </div>

              {!isCollapsed && (
                <>
                  {/* Lab details */}
                  <div className="border-t border-dashed border-[#35291a] px-5 py-5">
                    <h3 className={`mb-4 font-mono text-[9px] font-bold uppercase tracking-[0.28em] ${sector.accent}`}>
                      Journal details
                    </h3>
                    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Lab name" value={lab.name} onChange={(v) => updateLabMeta(sector.key, 'name', v)} placeholder="e.g. Portolan Charts" />
                      <Field label="Chapter" value={lab.chapterNumber} onChange={(v) => updateLabMeta(sector.key, 'chapterNumber', v)} placeholder="e.g. Chapter VII" />
                      <Field label="Title" value={lab.title} onChange={(v) => updateLabMeta(sector.key, 'title', v)} placeholder="e.g. Charting the Uncharted" />
                      <Field label="Subtitle" value={lab.subtitle} onChange={(v) => updateLabMeta(sector.key, 'subtitle', v)} placeholder="Short description" />
                      <Field label="Badge title" value={lab.badgeTitle} onChange={(v) => updateLabMeta(sector.key, 'badgeTitle', v)} placeholder="e.g. Cartographer's Badge" />
                      <Field label="Fragment name" value={lab.fragmentName ?? ''} onChange={(v) => updateLabMeta(sector.key, 'fragmentName', v)} placeholder="e.g. Map Fragment" />
                    </div>
                  </div>

                  {/* Products table */}
                  <div className="border-t border-dashed border-[#35291a] px-5 py-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <h3 className={`font-mono text-[9px] font-bold uppercase tracking-[0.28em] ${sector.accent}`}>
                          Waypoints
                        </h3>
                        <span className="rounded-sm border border-[#3d2f1c] px-1.5 py-0.5 font-mono text-[10px] text-[#cbb98d]">
                          {lab.checkpoints.length}/10
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <MiniBtn onClick={() => randomizeLayout(sector.key)} title="Generate a fresh, organic randomized node placement with safe margins">
                          ⚄ Randomize placement
                        </MiniBtn>
                        <MiniBtn onClick={() => autoArrange(sector.key)} title="Spread all products along an aesthetic winding trail across the map">
                          Auto-arrange route
                        </MiniBtn>
                        <button
                          onClick={() => addCheckpoint(sector.key)}
                          disabled={lab.checkpoints.length >= 10}
                          className="rounded border border-[#c9a227]/50 bg-[#c9a227]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#e8cd6f] transition hover:bg-[#c9a227]/20 disabled:cursor-not-allowed disabled:opacity-35"
                          title={lab.checkpoints.length >= 10 ? 'Maximum 10 products per sector' : 'Add new product'}
                        >
                          + Add product
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-[#35291a]">
                      <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
                        <thead>
                          <tr className="border-b border-[#35291a] bg-[#171209] font-mono text-[9px] uppercase tracking-[0.2em] text-[#a3906b]">
                            <th className="px-3 py-2.5 font-medium">#</th>
                            <th className="px-3 py-2.5 font-medium">Name</th>
                            <th className="px-3 py-2.5 font-medium">Description</th>
                            <th className="px-3 py-2.5 font-medium">Icon</th>
                            <th className="px-3 py-2.5 font-medium">X %</th>
                            <th className="px-3 py-2.5 font-medium">Y %</th>
                            <th className="px-3 py-2.5 font-medium">Move to</th>
                            <th className="px-3 py-2.5 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lab.checkpoints.map((cp, i) => (
                            <tr key={cp.id} className="border-b border-[#2a2013] align-top transition-colors last:border-b-0 hover:bg-[#211a11]">
                              <td className="px-3 py-2.5 font-mono text-[11px] text-[#6e5c3f]">
                                {String(i + 1).padStart(2, '0')}
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  value={cp.name}
                                  onChange={(e) => updateCheckpoint(sector.key, i, 'name', e.target.value)}
                                  className="w-36 rounded-sm border border-[#3d2f1c] bg-[#171209] px-2 py-1.5 text-[13px] text-[#ece0c4] outline-none transition focus:border-[#c9a227]/70"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <textarea
                                  value={cp.description}
                                  onChange={(e) => updateCheckpoint(sector.key, i, 'description', e.target.value)}
                                  rows={2}
                                  className="w-56 resize-y rounded-sm border border-[#3d2f1c] bg-[#171209] px-2 py-1.5 text-[13px] text-[#ece0c4] outline-none transition focus:border-[#c9a227]/70"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  value={cp.icon}
                                  onChange={(e) => updateCheckpoint(sector.key, i, 'icon', e.target.value)}
                                  className="w-14 rounded-sm border border-[#3d2f1c] bg-[#171209] px-2 py-1.5 text-center text-[13px] outline-none transition focus:border-[#c9a227]/70"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  value={cp.x}
                                  onChange={(e) => updateCheckpoint(sector.key, i, 'x', Number(e.target.value) || 0)}
                                  className="w-16 rounded-sm border border-[#3d2f1c] bg-[#171209] px-2 py-1.5 font-mono text-xs text-[#ece0c4] outline-none transition focus:border-[#c9a227]/70"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  value={cp.y}
                                  onChange={(e) => updateCheckpoint(sector.key, i, 'y', Number(e.target.value) || 0)}
                                  className="w-16 rounded-sm border border-[#3d2f1c] bg-[#171209] px-2 py-1.5 font-mono text-xs text-[#ece0c4] outline-none transition focus:border-[#c9a227]/70"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <select
                                  value=""
                                  onChange={(e) => moveToLab(sector.key, i, e.target.value as SectorKey)}
                                  className="w-24 rounded-sm border border-[#3d2f1c] bg-[#171209] px-1.5 py-1.5 text-xs text-[#cbb98d] outline-none transition focus:border-[#c9a227]/70"
                                >
                                  <option value="" disabled>
                                    Move…
                                  </option>
                                  {SECTORS.filter((s) => s.key !== sector.key).map((s) => (
                                    <option key={s.key} value={s.key}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  <IconBtn onClick={() => moveCheckpoint(sector.key, i, -1)} disabled={i === 0} title="Move up">
                                    ↑
                                  </IconBtn>
                                  <IconBtn onClick={() => moveCheckpoint(sector.key, i, 1)} disabled={i === lab.checkpoints.length - 1} title="Move down">
                                    ↓
                                  </IconBtn>
                                  <button
                                    onClick={() => deleteCheckpoint(sector.key, i)}
                                    className="rounded-sm border border-transparent px-2 py-1 text-xs text-[#a3906b] transition hover:border-[#5c2620] hover:text-[#e07b6a]"
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
                              <td colSpan={8} className="px-3 py-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[#6e5c3f]">
                                No products charted in this sector yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}

        {/* Sticky ledger bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#35291a] bg-[#171209]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
            <p className="text-[13px] text-[#a3906b]">
              {status ?? (
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                  Unsaved edits — changes go live on save
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded border border-[#3d2f1c] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a3906b] transition hover:border-[#8b3a2e] hover:text-[#e0a497]"
              >
                Reset to defaults
              </button>
              <button
                onClick={save}
                className="rounded border border-[#c9a227]/60 bg-gradient-to-b from-[#d9b23c] to-[#a8821d] px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#1c1206] shadow transition hover:brightness-110 active:scale-[0.98]"
              >
                Save changes ⌘
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
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

  // Debounce filter typing so we don't fire a request per keystroke.
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
      setFeedback(data);
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
    a.download = `uncharted-feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <section id="feedback" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          eyebrow="03 · The Ledger"
          title="Feedback"
          subtitle="Every discovery note logged by explorers."
        />
        <div className="flex gap-2">
          <MiniBtn onClick={exportFeedback}>⤓ Export CSV</MiniBtn>
          <MiniBtn onClick={fetchData}>⟳ Refresh</MiniBtn>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-md border border-[#35291a] bg-[#1c1610] p-4">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-[#a3906b]">
          Filter the ledger
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <FilterInput label="Email" placeholder="explorer@…" value={filters.email} onChange={(v) => handleFilterChange('email', v)} />
          <FilterInput label="Product ID" placeholder="a1…d10" value={filters.productId} onChange={(v) => handleFilterChange('productId', v)} />
          <FilterInput label="Department" placeholder="AI-DS…" value={filters.department} onChange={(v) => handleFilterChange('department', v)} />
          <button
            onClick={clearFilters}
            className="rounded border border-[#3d2f1c] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a3906b] transition hover:border-[#c9a227]/50 hover:text-[#efe3c2]"
          >
            Clear
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center font-mono text-xs uppercase tracking-[0.25em] text-[#6e5c3f]">
          Opening the ledger…
        </p>
      ) : error ? (
        <div className="rounded border border-[#5c2620] bg-[#241512] p-4 text-sm text-[#e0a497]">{error}</div>
      ) : feedback.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#35291a] bg-[#1c1610] p-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[#6e5c3f]">
          No entries match the current filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[#35291a]">
          <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#35291a] bg-[#171209] font-mono text-[9px] uppercase tracking-[0.2em] text-[#a3906b]">
                <th className="px-3 py-2.5 font-medium">Explorer</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Dept</th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Gemstone</th>
                <th className="px-3 py-2.5 font-medium">Notes</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f, i) => {
                const gem = GEMSTONE_TIERS.find((t) => t.tier === f.rating);
                return (
                  <tr key={`${f.studentEmail}-${f.tableId}-${i}`} className="border-b border-[#2a2013] align-top transition-colors last:border-b-0 hover:bg-[#211a11]">
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-[#ece0c4]">{f.studentName}</td>
                    <td className="px-3 py-2.5 text-[#a3906b]">{f.studentEmail}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[#cbb98d]">{f.studentDepartment}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[#cbb98d]">{f.tableId}</td>
                    <td className="px-3 py-2.5">
                      {gem ? (
                        <span className="whitespace-nowrap rounded-sm border border-[#3d2f1c] bg-[#171209] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#d9a441]">
                          {gem.name} · {gem.tier}
                        </span>
                      ) : (
                        f.rating
                      )}
                    </td>
                    <td className="max-w-[240px] break-words px-3 py-2.5 text-[#bda87e]">
                      {f.comment || <span className="text-[#6e5c3f]">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-[#a3906b]">
                      {new Date(f.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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

/* ============================== Atoms ============================== */

function MiniBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded border border-[#3d2f1c] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#cbb98d] transition hover:border-[#c9a227]/60 hover:text-[#efe3c2]"
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-sm border border-[#3d2f1c] px-2 py-1 text-xs text-[#cbb98d] transition hover:border-[#c9a227]/60 hover:text-[#efe3c2] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#3d2f1c] disabled:hover:text-[#cbb98d]"
    >
      {children}
    </button>
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
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-[#a3906b]">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[#3d2f1c] bg-[#171209] px-2.5 py-2 text-[13px] text-[#ece0c4] placeholder-[#5c4d34] outline-none transition focus:border-[#c9a227]/70"
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
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-[#a3906b]">
        {label}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-48 rounded-sm border border-[#3d2f1c] bg-[#171209] px-2.5 py-2 text-[13px] text-[#ece0c4] placeholder-[#5c4d34] outline-none transition focus:border-[#c9a227]/70"
      />
    </label>
  );
}
