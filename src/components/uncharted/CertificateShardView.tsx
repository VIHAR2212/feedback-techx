'use client';

import Link from 'next/link';
import { CertificateShard } from '@/lib/models';

interface CertificateShardViewProps {
  shard: CertificateShard;
  // When true, the user is logged in and owns this shard — show their name.
  ownerName?: string;
  showExpeditionLink?: boolean;
}

// Displays a single certificate shard. Plain skeleton card — no ornate
// gemstone art yet, just the inscription and metadata.
export default function CertificateShardView({
  shard,
  ownerName,
  showExpeditionLink,
}: CertificateShardViewProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-md border-2 border-foreground bg-background p-8 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Uncharted Expedition
      </p>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
        Certificate Shard · {shard.shardNumber} of 3
      </p>

      <h2 className="mt-6 text-2xl font-semibold leading-tight">{shard.labName}</h2>
      <div className="mx-auto my-4 h-px w-24 bg-foreground/40" />
      <p className="mx-auto max-w-md text-sm leading-relaxed text-foreground/90">
        {shard.inscription}
      </p>

      {ownerName && (
        <p className="mt-6 text-xs text-muted-foreground">
          Explorer: <span className="font-mono">{ownerName}</span>
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Issued: <span className="font-mono">{new Date(shard.earnedAt).toLocaleString()}</span>
      </p>

      {showExpeditionLink && (
        <div className="mt-6">
          <Link
            href="/expedition"
            className="rounded border border-foreground/40 px-3 py-1.5 text-xs hover:bg-muted"
          >
            ← Back to expedition map
          </Link>
        </div>
      )}
    </div>
  );
}
