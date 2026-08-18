'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import CertificateShardView from '@/components/uncharted/CertificateShardView';
import { getLabById, getShardInscription, LAB_ORDER } from '@/lib/mock-data';
import {
  loadExpeditionUser,
  isLabCompleted,
  isExpeditionComplete,
} from '@/lib/expedition-storage';
import { CertificateShard } from '@/lib/models';

// Certificate shard view — shown when a user clears a lab. The original
// project's "loot chest reveal" is replaced by this shard card. If the
// user hasn't actually cleared the lab yet, we send them back to the lab.
export default function CertificateShardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const labId = params.labId as string;
  const [shard, setShard] = useState<CertificateShard | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
      return;
    }
    if (!user) return;

    const lab = getLabById(labId);
    if (!lab) return;

    if (!isLabCompleted(user.email, labId)) {
      // Not earned yet — bounce back to the lab page.
      router.push(`/expedition/${labId}`);
      return;
    }

    const u = loadExpeditionUser(user.email);
    const shardNumber = (LAB_ORDER.indexOf(labId) + 1) as 1 | 2 | 3;
    setShard({
      labId: lab.labId,
      labName: lab.labName,
      shardNumber,
      earnedAt: u.completionDate ?? new Date().toISOString(),
      inscription: getShardInscription(labId),
    });
  }, [user, isLoading, labId, router]);

  if (isLoading || !user || !shard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading certificate shard…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="w-full">
        <CertificateShardView
          shard={shard}
          ownerName={user.name}
          showExpeditionLink
        />
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
          {isExpeditionComplete(user.email) && (
            <button
              onClick={() => router.push('/finish')}
              className="rounded border-2 border-foreground bg-foreground px-3 py-1.5 text-background hover:opacity-90"
            >
              View final certificate →
            </button>
          )}
          <button
            onClick={() => router.push('/expedition')}
            className="rounded border border-foreground/40 px-3 py-1.5 hover:bg-muted"
          >
            Expedition map
          </button>
        </div>
      </div>
    </main>
  );
}
