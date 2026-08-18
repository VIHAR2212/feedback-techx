'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { LABS, LAB_ORDER } from '@/lib/mock-data';
import CheckpointCard from '@/components/uncharted/CheckpointCard';
import { loadExpeditionUser, isExpeditionComplete } from '@/lib/expedition-storage';

// Expedition map — replaces /labs. Shows 3 checkpoints (A/B/C) with
// physical-style lock/shard state. Linear progression: B unlocks when A
// is cleared, C unlocks when B is cleared.
export default function ExpeditionMapPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();
  const { shards } = useCompletion();
  const [snapshot, setSnapshot] = useState<ReturnType<typeof loadExpeditionUser> | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      setSnapshot(loadExpeditionUser(user.email));
    }
  }, [user, isLoading, router]);

  // Re-hydrate whenever shards change (so freshly-earned shard shows up).
  useEffect(() => {
    if (user) setSnapshot(loadExpeditionUser(user.email));
  }, [user, shards]);

  if (isLoading || !user || !snapshot) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading expedition map…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-foreground">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Expedition Map
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Choose your checkpoint</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Clear each checkpoint in order. Each checkpoint cleared earns a certificate shard.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Signed in: <span className="font-mono">{user.name}</span></p>
          <p className="mt-0.5">
            Shards: <span className="font-mono">{shards.length}/{LAB_ORDER.length}</span>
          </p>
          <button
            onClick={logout}
            className="mt-2 rounded border border-foreground/30 px-2 py-1 text-[10px] hover:bg-muted"
          >
            Logout
          </button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((lab, idx) => {
          const completed = lab.products.filter((p) =>
            snapshot.completedProducts.includes(p.id)
          ).length;
          const unlocked = snapshot.unlockedLabs.includes(lab.labId);
          const shardEarned = snapshot.completedLabs.includes(lab.labId);
          return (
            <CheckpointCard
              key={lab.labId}
              labId={lab.labId}
              labName={lab.labName}
              productCount={lab.products.length}
              completedCount={completed}
              unlocked={unlocked}
              shardEarned={shardEarned}
              shardNumber={(idx + 1) as 1 | 2 | 3}
            />
          );
        })}
      </section>

      {isExpeditionComplete(user.email) && (
        <div className="mt-8 rounded-md border-2 border-foreground bg-foreground/5 p-5 text-center">
          <h2 className="text-base font-semibold">Expedition complete</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            You have collected all 3 certificate shards.
          </p>
          <button
            onClick={() => router.push('/finish')}
            className="mt-4 rounded border-2 border-foreground bg-foreground px-4 py-2 text-xs text-background hover:opacity-90"
          >
            View final certificate →
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-2 text-xs">
        <button
          onClick={() => router.push('/leaderboard')}
          className="rounded border border-foreground/40 px-3 py-1.5 hover:bg-muted"
        >
          Expedition Rankings
        </button>
        {snapshot.completedLabs.length > 0 && (
          <button
            onClick={() => router.push(`/certificate/${snapshot.completedLabs[0]}`)}
            className="rounded border border-foreground/40 px-3 py-1.5 hover:bg-muted"
          >
            View a collected shard
          </button>
        )}
      </div>
    </main>
  );
}
