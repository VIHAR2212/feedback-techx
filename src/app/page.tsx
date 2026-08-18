'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { isExpeditionComplete } from '@/lib/expedition-storage';
import LandingReveal from '@/components/scroll/LandingReveal';

// Landing page. Signed-out visitors get the scroll-driven TechX frame
// reveal (logo -> frame sequence -> signup card), handled entirely by
// LandingReveal. Signed-in explorers see a quick "welcome back" panel.
export default function LandingPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      if (isExpeditionComplete(user.email)) {
        router.push('/finish');
      } else {
        router.push('/expedition');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading…</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="w-full max-w-md rounded-md border-2 border-foreground p-6">
          <h1 className="text-center text-xl font-semibold">Welcome back, explorer</h1>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            You are signed in as <span className="font-mono">{user.name}</span> ({user.email})
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Department: <span className="font-mono">{user.department}</span>
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                if (isExpeditionComplete(user.email)) router.push('/finish');
                else router.push('/expedition');
              }}
              className="rounded border-2 border-foreground bg-foreground px-4 py-2 text-xs text-background hover:opacity-90"
            >
              Continue Expedition
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="rounded border border-foreground/40 px-4 py-2 text-xs hover:bg-muted"
            >
              Expedition Rankings
            </button>
            <button
              onClick={logout}
              className="rounded border border-foreground/40 px-4 py-2 text-xs text-muted-foreground hover:bg-muted"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <LandingReveal />;
}
