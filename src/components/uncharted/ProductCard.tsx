'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  icon: string;
  isSubmitted?: boolean;
  disabled?: boolean;
}

// Replaces MinecraftCard. Same shape, same behaviour: click -> go to the
// discovery page for that product (or no-op if already submitted / locked).
export default function ProductCard({ id, name, icon, isSubmitted, disabled }: ProductCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isSubmitted || disabled) return;
    router.push(`/discover/${id}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitted || disabled}
      aria-label={`Discover ${name}`}
      className={cn(
        'relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-md border-2 p-4 text-center transition-colors',
        isSubmitted
          ? 'border-muted bg-muted/30 text-muted-foreground'
          : disabled
            ? 'border-muted bg-muted/20 text-muted-foreground opacity-60'
            : 'border-foreground/30 bg-background hover:border-foreground hover:bg-accent'
      )}
    >
      <span className="text-3xl leading-none" aria-hidden>{icon}</span>
      <span className="text-sm font-medium leading-tight">{name}</span>
      {isSubmitted && (
        <span className="absolute right-1 top-1 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
          Logged
        </span>
      )}
      {disabled && !isSubmitted && (
        <span className="absolute right-1 top-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
          Locked
        </span>
      )}
    </button>
  );
}
