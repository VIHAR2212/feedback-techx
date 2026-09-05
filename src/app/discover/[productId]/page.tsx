'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import GemstoneRating from '@/components/uncharted/GemstoneRating';
import { getProductById, LAB_ORDER } from '@/lib/mock-data';
import { GEMSTONE_TIERS, type GemstoneTier } from '@/lib/models';
import {
  saveCompletedProduct,
  recalculateProgress,
  appendClue,
  loadExpeditionUser,
} from '@/lib/expedition-storage';
import type { ExpeditionUser } from '@/lib/models';
import { enqueueSubmission, fetchWithTimeout } from '@/lib/offline-queue';

// Product discovery + feedback page.
// Flow:
//   1. User rates the product with one of 5 gemstones (Rough Stone..Diamond).
//   2. Optional expedition-notes comment.
//   3. Submit -> POST /api/feedback (or offline queue) -> inline result card with clue reveal.
//   4. Optional treasure-hunt note shown next to the result.
//   5. Redirect back to the lab page. If that was the last product in the
//      lab, the lab completion + shard are awarded automatically by
//      recalculateProgress().
export default function DiscoverPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const productId = params.productId as string;

  const [rating, setRating] = useState<GemstoneTier | 0>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ExpeditionUser | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [result, setResult] = useState<{
    clue: { id: string; title: string; body: string } | null;
  } | null>(null);
  const isMounted = useRef(true);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
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

  // Read localStorage progress in an effect (never during render) so the
  // server render and first client paint agree — no hydration mismatch.
  useEffect(() => {
    if (user?.email) {
      setProgress(loadExpeditionUser(user.email));
    }
  }, [user]);

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

  const labProductsDone = progress
    ? lab.products.filter((p) => progress.completedProducts.includes(p.id)).length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    setError(null);
    let offlineSaved = false;

    // Idempotent client-generated submissionId
    const submissionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const feedbackPayload = {
      studentName: user.name,
      studentEmail: user.email,
      studentDepartment: user.department,
      rating,
      comment,
      tableId: product.id,
      submissionId,
    };

    try {
      // 1. Attempt to persist feedback to the backend or queue offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueSubmission(feedbackPayload);
        offlineSaved = true;
      } else {
        try {
          const response = await fetchWithTimeout(
            '/api/feedback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(feedbackPayload),
            },
            6000
          );
          if (!response.ok) throw new Error('Failed to submit feedback');
        } catch (fetchErr) {
          console.warn('[discover] Online submission failed, enqueuing offline:', fetchErr);
          enqueueSubmission(feedbackPayload);
          offlineSaved = true;
        }
      }

      setIsOfflineSaved(offlineSaved);

      // 2. Mirror progress to localStorage + recalc lab/shard state.
      saveCompletedProduct(user.email, product.id);
      const newProgress = recalculateProgress(user.email);

      // 3. Roll for a clue via the clue API (skip or catch if offline).
      let clue: { id: string; title: string; body: string } | null = null;
      if (!offlineSaved) {
        try {
          const clueRes = await fetchWithTimeout(
            '/api/expedition/clue',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ labId: lab.labId }),
            },
            4000
          );
          if (clueRes.ok) {
            const clueData = (await clueRes.json()) as {
              clue: { id: string; title: string; body: string } | null;
            };
            clue = clueData.clue || null;
            if (clue) {
              appendClue(user.email, clue.id);
            }
          }
        } catch {
          // Non-critical, continue without clue on poor network
        }
      }

      // 4. Show the result inline with the clue reveal (or "no clue").
      setResult({ clue });

      // 5. Dispatch event so ExpeditionProgress + CompletionChecker update.
      window.dispatchEvent(
        new CustomEvent('feedbackSubmitted', {
          detail: { completed: newProgress.isExpeditionComplete, offline: offlineSaved },
        })
      );

      // 6. After a short delay, route back to the lab page (or to /finish
      //    if this submit completed the whole expedition). The timer is
      //    cleared on unmount so we never navigate a dead page.
      redirectTimerRef.current = setTimeout(() => {
        if (newProgress.isExpeditionComplete) {
          router.push('/finish');
        } else {
          router.push(`/expedition/${lab.labId}`);
        }
      }, 2500);
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
          <p className="mt-4 rounded border border-dashed border-red-500/50 bg-red-500/10 p-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {!result && (
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
        )}
      </form>

      {/* Inline discovery-result card (replaces the old global toast) */}
      {result && (
        <section className="mt-5 rounded-md border-2 border-foreground bg-foreground/5 p-5" aria-live="polite">
          <h2 className="text-base font-semibold">✦ Discovery logged</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.name} ({lab.labName}) — rated{' '}
            {GEMSTONE_TIERS.find((t) => t.tier === rating)?.name ?? rating}.
          </p>
          {isOfflineSaved && (
            <div className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200">
              ⚡ <strong>Saved offline.</strong> Your discovery is safely stored on your device and will sync to the expedition server automatically.
            </div>
          )}
          {result.clue ? (
            <div className="mt-4 rounded border border-dashed border-foreground/40 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Clue found · {result.clue.title}
              </p>
              <p className="mt-1 text-sm italic">{result.clue.body}</p>
            </div>
          ) : (
            <p className="mt-4 rounded border border-dashed border-foreground/30 p-3 text-xs text-muted-foreground">
              No clue this time — keep exploring.
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">Returning to the checkpoint…</p>
        </section>
      )}

      <p className="mt-6 text-[10px] text-muted-foreground">
        Lab order: {LAB_ORDER.join(' → ')}
      </p>
    </main>
  );
}
