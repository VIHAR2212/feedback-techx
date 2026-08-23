'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  to: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  to,
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const goBack = useCallback(() => {
    router.push(to);
  }, [router, to]);

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={`Back to ${label}`}
      className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded border border-[#6b4728] bg-[#22150e]/95 px-2.5 font-mono text-[#c99f58] shadow-sm backdrop-blur-sm transition hover:border-[#8a5d33] hover:text-[#f3dfa2] active:scale-95 ${className}`}
    >
      <span className="text-xs font-bold leading-none">◀</span>
      <span className="text-[9px] uppercase tracking-[0.22em] leading-none">
        {label}
      </span>
    </button>
  );
}
