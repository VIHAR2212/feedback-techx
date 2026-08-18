'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { getLabById, LAB_ORDER } from '@/lib/mock-data';
import ProductCard from '@/components/uncharted/ProductCard';
import {
  loadExpeditionUser,
  isLabUnlocked,
  isExpeditionComplete,
} from '@/lib/expedition-storage';

// Lab product map — replaces /labs/[labId]. Shows every product in the
// lab as a "discovery" tile. Submitted tiles are marked. Locked labs
// (user hasn't cleared previous checkpoint yet) render as disabled.
export default function LabProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const labId = params.labId as string;
  const [completedProducts, setCompletedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      const u = loadExpeditionUser(user.email);
      setCompletedProducts(u.completedProducts);
    }
  }, [user, isLoading, router]);

  // Re-read on focus in case progress changed in another tab.
  useEffect(() => {
    if (!user) return;
    const handler = () => {
      const u = loadExpeditionUser(user.email);
      setCompletedProducts(u.completedProducts);
    };
    window.addEventListener('focus', handler);
    window.addEventListener('feedbackSubmitted', handler);
    return () => {
      window.removeEventListener('focus', handler);
      window.removeEventListener('feedbackSubmitted', handler);
    };
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading checkpoint…</p>
      </main>
    );
  }

  const lab = getLabById(labId);
  if (!lab) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-foreground">
        <p>Unknown checkpoint: {labId}</p>
        <Link href="/expedition" className="mt-3 inline-block text-xs underline">
          ← Back to expedition map
        </Link>
      </main>
    );
  }

  const unlocked = isLabUnlocked(user.email, labId);
  const allDone = lab.products.every((p) => completedProducts.includes(p.id));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-foreground">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Checkpoint {lab.labId.toUpperCase()} · {LAB_ORDER.indexOf(lab.labId) + 1} of {LAB_ORDER.length}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{lab.labName}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap a discovery tile to log your gemstone rating and expedition notes.
        </p>
        <div className="mt-3">
          <Link
            href="/expedition"
            className="rounded border border-foreground/30 px-3 py-1.5 text-xs hover:bg-muted"
          >
            ← Back to expedition map
          </Link>
        </div>
      </header>

      {!unlocked && (
        <div className="mb-6 rounded-md border-2 border-dashed border-foreground/30 bg-muted/30 p-4 text-xs text-muted-foreground">
          This checkpoint is locked. Clear the previous checkpoint to unlock it.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {lab.products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            icon={p.icon}
            isSubmitted={completedProducts.includes(p.id)}
            disabled={!unlocked}
          />
        ))}
      </div>

      {allDone && unlocked && (
        <div className="mt-8 rounded-md border-2 border-foreground bg-foreground/5 p-5 text-center">
          <h2 className="text-base font-semibold">Checkpoint cleared</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            You have logged every discovery in {lab.labName}. A certificate shard has been added to your journal.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => router.push(`/certificate/${labId}`)}
              className="rounded border-2 border-foreground bg-foreground px-4 py-2 text-xs text-background hover:opacity-90"
            >
              View certificate shard →
            </button>
            {isExpeditionComplete(user.email) ? (
              <button
                onClick={() => router.push('/finish')}
                className="rounded border border-foreground/40 px-4 py-2 text-xs hover:bg-muted"
              >
                View final certificate →
              </button>
            ) : (
              <button
                onClick={() => router.push('/expedition')}
                className="rounded border border-foreground/40 px-4 py-2 text-xs hover:bg-muted"
              >
                Back to expedition map →
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
