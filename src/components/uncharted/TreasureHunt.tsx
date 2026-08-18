'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Treasure } from '@/lib/models';

interface TreasureHuntProps {
  open: boolean;
  onClose: () => void;
  onHuntResolved: (treasure: Treasure) => void;
}

// Skeleton treasure-hunt modal. The "hunt" is a simple yes/no gamble:
// pick "Dig here" or "Skip" — no fancy game logic or animations yet.
// Picking "Dig here" calls the /api/expedition/treasure endpoint which
// returns a random Treasure (one entry is an "Empty Cache" dud).
export default function TreasureHunt({ open, onClose, onHuntResolved }: TreasureHuntProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleDig = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/expedition/treasure', { method: 'POST' });
      if (!res.ok) throw new Error('Treasure service unavailable');
      const data = (await res.json()) as { treasure: Treasure };
      onHuntResolved(data.treasure);
      onClose();
    } catch {
      setError('Could not reach the treasure service.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className={cn('w-[min(92vw,420px)] rounded-md border-2 border-foreground bg-background p-5')}>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Optional</p>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground" aria-label="Close">
            ×
          </button>
        </div>
        <h3 className="text-base font-semibold leading-tight">Optional Treasure Hunt</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Roll the dice — you might find a small relic, or just more dust. Skipping changes nothing.
          This never blocks expedition progress.
        </p>
        {error && (
          <p className="mt-3 rounded border border-dashed border-foreground/40 bg-muted/30 p-2 text-xs text-foreground">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded border border-foreground/30 px-3 py-1.5 text-xs hover:bg-muted"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleDig}
            disabled={busy}
            className="rounded border-2 border-foreground bg-foreground px-3 py-1.5 text-xs text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Digging…' : 'Dig here'}
          </button>
        </div>
      </div>
    </div>
  );
}
