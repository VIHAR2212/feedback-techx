'use client';

import Link from 'next/link';
import { FinalCertificate } from '@/lib/models';

interface FinalCertificateViewProps {
  cert: FinalCertificate;
}

// Final certificate — shown on /finish once the user has all 3 shards.
// Skeleton layout only, no ornate borders or aged-paper texture yet.
export default function FinalCertificateView({ cert }: FinalCertificateViewProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-md border-2 border-foreground bg-background p-10 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        Uncharted Expedition · Final Certificate
      </p>
      <h1 className="mt-6 text-3xl font-semibold leading-tight">{cert.expeditionName}</h1>
      <div className="mx-auto my-5 h-px w-32 bg-foreground/40" />

      <p className="text-sm text-muted-foreground">This is to certify that</p>
      <p className="mt-2 text-xl font-semibold">{cert.explorerName}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {cert.explorerEmail} · {cert.explorerDepartment}
      </p>
      <p className="mt-5 text-sm leading-relaxed text-foreground/90">
        has successfully completed all three checkpoints of the expedition, collecting every
        certificate shard, and is hereby recognised as a full-fledged Expedition Explorer.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {cert.shardInscriptions.map((s, i) => (
          <div
            key={i}
            className="rounded border border-foreground/20 bg-muted/30 p-3 text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shard {i + 1} of 3
            </p>
            <p className="mt-1 text-xs leading-relaxed">{s}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Issued: <span className="font-mono">{new Date(cert.issuedAt).toLocaleString()}</span>
      </p>

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/leaderboard"
          className="rounded border border-foreground/40 px-3 py-1.5 text-xs hover:bg-muted"
        >
          View expedition rankings
        </Link>
      </div>
    </div>
  );
}
