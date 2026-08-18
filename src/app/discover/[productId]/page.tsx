'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useExpedition } from '@/context/ExpeditionContext';
import GemstoneRating from '@/components/uncharted/GemstoneRating';
import { getProductById, LAB_ORDER } from '@/lib/mock-data';
import { GEMSTONE_TIERS, type GemstoneTier } from '@/lib/models';
import {
  saveCompletedProduct,
  recalculateProgress,
  appendClue,
  loadExpeditionUser,
} from '@/lib/expedition-storage';

// Product discovery + feedback page — replaces /feedback/[tableId].
// Flow:
//   1. User rates the product with one of 5 gemstones (Rough Stone..Diamond).
//   2. Optional expedition-notes comment.
//   3. Submit -> POST /api/feedback (mock store) -> FeedbackResultCard toast.
//   4. Roll for clue (50% chance) -> clue shown in the toast OR "no clue".
//   5. Optional treasure-hunt button appears next to the result.
//   6. Redirect back to the lab page. If that was the last product in the
//      lab, the lab completion + shard are awarded automatically by
//      recalculateProgress().
export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { addResult } = useExpedition();
  const productId = params.productId as string;

  const [rating, setRating] = useState<GemstoneTier | 0>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Only redirect once we've finished hydrating the session. Redirecting
  // during the brief loading window would otherwise bounce the user to '/'
  // even though they ARE logged in.
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const lookup = getProductById(productId);
  if (!lookup) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-foreground">
        <p>Unknown product: {productId}</p>
        <Link href="/expedition" className="mt-3 inline-block text-xs underline">
          ← Back to expedition map
        </Link>
      </main>
    );
  }
  const { product, lab } = lookup;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('User information not found. Please return to the landing page.');
      return;
    }
    if (rating === 0) {
      alert('A gemstone rating is required!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Persist feedback to the mock backend (or real DB once seniors
      //    swap services.ts).
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.name,
          studentEmail: user.email,
          studentDepartment: user.department,
          rating,
          comment,
          tableId: product.id,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to submit feedback');

      // 2. Mirror progress to localStorage + recalc lab/shard state.
      saveCompletedProduct(user.email, product.id);
      const progress = recalculateProgress(user.email);

      // 3. Roll for a clue via the clue API (50% chance server-side).
      const clueRes = await fetch('/api/expedition/clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labId: lab.labId }),
      });
      const clueData = (await clueRes.json()) as {
        clue: { id: string; title: string; body: string } | null;
      };

      if (clueData.clue) {
        appendClue(user.email, clueData.clue.id);
      }

      // 4. Toast feedback result card with the embedded reveal.
      addResult({
        title: 'Discovery logged',
        subtitle: `${product.name} (${lab.labName})`,
        productId: product.id,
        productName: product.name,
        rating,
        reveal: clueData.clue
          ? {
              kind: 'clue' as const,
              clueId: clueData.clue.id,
              clueTitle: clueData.clue.title,
              clueBody: clueData.clue.body,
            }
          : { kind: 'empty' as const },
        duration: 0, // sticky until user dismisses
      });

      // 5. Surface the optional treasure-hunt button (lives in the toast
      //    itself via ExpeditionManager so it survives the page redirect).

      // 6. Dispatch event so ExpeditionProgress + CompletionChecker update.
      window.dispatchEvent(
        new CustomEvent('feedbackSubmitted', {
          detail: { completed: progress.isExpeditionComplete },
        })
      );

      // 7. After a short delay, route back to the lab page (or to /finish
      //    if this submit completed the whole expedition).
      setTimeout(() => {
        if (progress.isExpeditionComplete) {
          router.push('/finish');
        } else {
          router.push(`/expedition/${lab.labId}`);
        }
      }, 1200);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Something went wrong while submitting your discovery.');
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  // Render-time lookup of the gemstone label (for the helper caption).
  const tierLabel =
    rating > 0 ? GEMSTONE_TIERS.find((t) => t.tier === rating)?.name : null;

  const progress = user ? loadExpeditionUser(user.email) : null;
  const labProductsDone = progress
    ? lab.products.filter((p) => progress.completedProducts.includes(p.id)).length
    : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 text-foreground">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {lab.labName} · Discovery {labProductsDone}/{lab.products.length}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Rate this discovery using one of the five gemstones and log any expedition notes.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-md border-2 border-foreground p-5"
      >
        <p className="text-xs text-muted-foreground">
          Submitting as <span className="font-mono">{user?.name}</span> ({user?.email})
        </p>

        <div className="mt-4">
          <label className="block text-xs text-muted-foreground">
            Gemstone rating
          </label>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Rough Stone = 1 · Emerald = 2 · Ruby = 3 · Sapphire = 4 · Diamond = 5
          </p>
          <div className="mt-3">
            <GemstoneRating
              rating={rating}
              setRating={(r) => setRating(r as GemstoneTier)}
              disabled={isSubmitting}
            />
          </div>
          {tierLabel && (
            <p className="mt-2 text-xs">
              Selected: <span className="font-mono">{tierLabel}</span> (tier {rating})
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-xs text-muted-foreground">
            Expedition notes (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="Anything notable about this discovery?"
            className="mt-2 w-full rounded border border-foreground/30 bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 rounded border border-dashed border-foreground/40 bg-muted/30 p-2 text-xs">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/expedition/${lab.labId}`}
            className="rounded border border-foreground/30 px-3 py-1.5 text-xs hover:bg-muted"
          >
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="rounded border-2 border-foreground bg-foreground px-4 py-2 text-xs text-background hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Logging…' : 'Log discovery'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-[10px] text-muted-foreground">
        Lab order: {LAB_ORDER.join(' → ')} · Treasure hunt button lives in the result toast after submit.
      </p>
    </main>
  );
}
