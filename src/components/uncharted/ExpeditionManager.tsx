'use client';

import { useState } from 'react';
import { useExpedition, type FeedbackResult } from '@/context/ExpeditionContext';
import { useUser } from '@/context/UserContext';
import { GEMSTONE_TIERS } from '@/lib/models';
import { cn } from '@/lib/utils';
import TreasureHunt from './TreasureHunt';
import { appendTreasure } from '@/lib/expedition-storage';

// Renders the stack of "Feedback Result Card" toasts. Replaces
// AchievementManager from the original project. Each toast shows the
// product just rated, the gemstone tier selected, and (if a clue was
// revealed) a small clue snippet. The treasure-hunt button lives inside
// the toast so it follows the user across page redirects.
export default function ExpeditionManager() {
  const { results, dismissResult, addResult } = useExpedition();
  const { user } = useUser();
  const [treasureOpen, setTreasureOpen] = useState(false);

  if (results.length === 0 && !treasureOpen) return null;

  return (
    <>
      <div className="pointer-events-none fixed bottom-16 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
        {results.map((r) => (
          <Toast
            key={r.id}
            result={r}
            onDismiss={() => dismissResult(r.id)}
            onTryTreasure={() => setTreasureOpen(true)}
          />
        ))}
      </div>

      <TreasureHunt
        open={treasureOpen}
        onClose={() => setTreasureOpen(false)}
        onHuntResolved={(t) => {
          if (user) appendTreasure(user.email, t.id);
          addResult({
            title: 'Treasure hunt resolved',
            subtitle: t.name,
            duration: 4000,
          });
        }}
      />
    </>
  );
}

function Toast({
  result,
  onDismiss,
  onTryTreasure,
}: {
  result: FeedbackResult;
  onDismiss: () => void;
  onTryTreasure: () => void;
}) {
  const tier = result.rating ? GEMSTONE_TIERS.find((t) => t.tier === result.rating) : undefined;
  return (
    <div
      className={cn(
        'pointer-events-auto rounded-md border-2 border-foreground bg-background p-4 shadow-lg'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Discovery Logged
          </p>
          <h4 className="mt-0.5 text-sm font-semibold leading-tight">
            {result.productName ?? result.title}
          </h4>
          {tier && (
            <p className="mt-1 text-xs text-muted-foreground">
              Gemstone: <span className="font-mono">{tier.name}</span> (tier {tier.tier})
            </p>
          )}
          {result.reveal && (
            <div className="mt-2 rounded border border-dashed border-foreground/40 bg-muted/30 p-2 text-xs">
              {result.reveal.kind === 'clue' ? (
                <>
                  <p className="font-semibold">Clue uncovered: {result.reveal.clueTitle}</p>
                  <p className="mt-0.5 text-muted-foreground">{result.reveal.clueBody}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No clue surfaced this time — keep exploring.</p>
              )}
            </div>
          )}
          {result.subtitle && result.subtitle !== result.productName && (
            <p className="mt-2 text-xs italic text-muted-foreground">{result.subtitle}</p>
          )}
          {result.reveal && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onTryTreasure}
                className="rounded border-2 border-foreground bg-foreground px-2.5 py-1 text-[10px] text-background hover:opacity-90"
              >
                Try treasure hunt (optional)
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}
