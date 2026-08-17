'use client';

import { GEMSTONE_TIERS, type GemstoneTier } from '@/lib/models';
import { cn } from '@/lib/utils';

interface GemstoneRatingProps {
  rating: number;
  setRating: (r: GemstoneTier) => void;
  disabled?: boolean;
}

// Skeleton gemstone rating widget. Renders 5 plain labelled buttons —
// no fancy gemstone artwork yet. Each tier is one of:
//   1 = Rough Stone, 2 = Emerald, 3 = Ruby, 4 = Sapphire, 5 = Diamond.
export default function GemstoneRating({ rating, setRating, disabled }: GemstoneRatingProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Gemstone rating">
      {GEMSTONE_TIERS.map(({ tier, name }) => {
        const selected = tier <= rating;
        return (
          <button
            type="button"
            key={tier}
            disabled={disabled}
            onClick={() => setRating(tier as GemstoneTier)}
            aria-pressed={selected}
            aria-label={`${name} (tier ${tier})`}
            className={cn(
              'flex h-20 w-24 flex-col items-center justify-center rounded-md border-2 text-xs font-medium transition-colors',
              selected
                ? 'border-foreground bg-foreground text-background'
                : 'border-muted bg-muted/40 text-foreground hover:bg-muted',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span className="text-lg leading-none">◆</span>
            <span className="mt-1 text-center leading-tight">{name}</span>
            <span className="mt-0.5 text-[10px] opacity-70">Tier {tier}</span>
          </button>
        );
      })}
    </div>
  );
}
