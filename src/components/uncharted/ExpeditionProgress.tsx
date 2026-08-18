'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { LAB_ORDER, totalProductCount } from '@/lib/mock-data';

// Replaces XpBar. Skeleton bar showing overall expedition progress +
// collected shards. Also redirects to /finish when all 3 shards collected.
export default function ExpeditionProgress() {
  const { user } = useUser();
  const { isCompleted, shards } = useCompletion();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (isCompleted) {
      // Soft-redirect; we don't want to yank the user away from a page
      // they explicitly navigated to. Only kick in on feedback submit
      // event (handled by the discover page itself).
    }
  }, [user, isCompleted, router]);

  if (!user) return null;

  const pct = Math.min(100, Math.round((shards.length / LAB_ORDER.length) * 100));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-foreground/20 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2 text-xs">
        <span className="font-semibold">Expedition Progress</span>
        <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-muted-foreground">
          {shards.length}/{LAB_ORDER.length} shards · {totalProductCount()} total discoveries
        </span>
      </div>
    </div>
  );
}
