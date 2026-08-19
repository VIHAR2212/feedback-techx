'use client';

import { useUser } from '@/context/UserContext';
import LandingReveal from '@/components/scroll/LandingReveal';

export default function LandingPage() {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-foreground">
        <p className="text-sm font-cinzel text-amber-200/60 uppercase tracking-widest animate-pulse">
          Loading…
        </p>
      </main>
    );
  }

  return <LandingReveal />;
}
