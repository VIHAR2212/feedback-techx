'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CheckpointCardProps {
  labId: string;
  labName: string;
  productCount: number;
  completedCount: number;
  unlocked: boolean;
  shardEarned: boolean;
  shardNumber?: 1 | 2 | 3;
}

// Replaces the old lab list button on `/labs`. Renders a physical-style
// checkpoint card with lock/unlock + shard state. No fancy map imagery
// yet — just a clean skeleton block.
export default function CheckpointCard({
  labId,
  labName,
  productCount,
  completedCount,
  unlocked,
  shardEarned,
  shardNumber,
}: CheckpointCardProps) {
  const cardContent = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Checkpoint {labId.toUpperCase()}
            {shardNumber ? ` · Shard ${shardNumber}/3` : ''}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-tight">{labName}</h3>
        </div>
        <div className="text-2xl leading-none" aria-hidden>
          {shardEarned ? '🛡️' : unlocked ? '🧭' : '🔒'}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Discoveries logged</span>
          <span className="font-mono">{completedCount}/{productCount}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
          <div
            className={cn(
              'h-full transition-all',
              shardEarned ? 'bg-foreground' : 'bg-foreground/60'
            )}
            style={{
              width: `${productCount > 0 ? (completedCount / productCount) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between">
          <span>{shardEarned ? 'Certificate shard earned' : unlocked ? 'Tap to enter' : 'Locked — clear previous checkpoint'}</span>
        </div>
      </div>
    </>
  );

  const cardClassName = cn(
    'flex min-h-40 flex-col justify-between gap-3 rounded-md border-2 p-5 transition-colors',
    !unlocked
      ? 'border-muted bg-muted/20 text-muted-foreground'
      : shardEarned
        ? 'border-foreground bg-foreground/5'
        : 'border-foreground/30 bg-background hover:border-foreground hover:bg-accent'
  );

  if (unlocked) {
    return (
      <Link
        href={`/expedition/${labId}`}
        className={cardClassName}
        aria-label={labName}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={cardClassName}
      aria-label={`${labName} (locked)`}
    >
      {cardContent}
    </div>
  );
}
