'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import FinalCertificateView from '@/components/uncharted/FinalCertificateView';
import {
  loadExpeditionUser,
  isExpeditionComplete,
} from '@/lib/expedition-storage';
import { buildFinalCertificate } from '@/lib/services';
import { FinalCertificate } from '@/lib/models';

// Expedition finish — replaces the loot-chest reveal. When the user has
// collected all 3 shards, this page renders the final certificate. If
// they somehow land here without 3 shards we bounce them back to the
// expedition map.
export default function FinishPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();
  const [cert, setCert] = useState<FinalCertificate | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
      return;
    }
    if (!user) return;

    if (!isExpeditionComplete(user.email)) {
      router.push('/expedition');
      return;
    }

    const u = loadExpeditionUser(user.email);
    const fullUser = {
      ...u,
      name: user.name,
      department: user.department,
    };
    const built = buildFinalCertificate(fullUser);
    setCert(built);
    setChecking(false);
  }, [user, isLoading, router]);

  if (isLoading || checking || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading final certificate…</p>
      </main>
    );
  }

  if (!cert) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-foreground">
        <p>Final certificate is not yet available.</p>
        <button
          onClick={() => router.push('/expedition')}
          className="mt-3 rounded border border-foreground/30 px-3 py-1.5 text-xs hover:bg-muted"
        >
          Back to expedition map
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full">
        <FinalCertificateView cert={cert} />
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
          <button
            onClick={() => router.push('/leaderboard')}
            className="rounded border border-foreground/40 px-3 py-1.5 hover:bg-muted"
          >
            Expedition rankings
          </button>
          <button
            onClick={logout}
            className="rounded border border-foreground/40 px-3 py-1.5 text-muted-foreground hover:bg-muted"
          >
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
