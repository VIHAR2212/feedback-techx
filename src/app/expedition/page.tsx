'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { loadExpeditionUser } from '@/lib/expedition-storage';
import InteractiveTreasureMap from '@/components/uncharted/InteractiveTreasureMap';

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
      <main className="flex min-h-screen items-center justify-center bg-black text-amber-200/80">
        <p className="text-sm font-cinzel uppercase tracking-widest animate-pulse">
          Unfurling Expedition Map…
        </p>
      </main>
    );
  }

  return (
    <InteractiveTreasureMap
      snapshot={snapshot}
      user={user}
      logout={logout}
    />
  );
}
