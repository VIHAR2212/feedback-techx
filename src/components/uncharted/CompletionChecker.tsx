'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { isExpeditionComplete } from '@/lib/expedition-storage';

// Replaces CompletionChecker. Only redirects the user to /finish at the
// moment their last shard is earned — i.e. on the feedbackSubmitted
// event. We deliberately do NOT redirect on every mount once the user
// is already complete (otherwise they could never reach /leaderboard,
// /certificate/*, or /admin/* after finishing the expedition).
export default function CompletionChecker() {
  const { user } = useUser();
  const { isCompleted } = useCompletion();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const handler = () => {
      // Only kick in when the transition from "not complete" → "complete"
      // happens. Once `isCompleted` is true (React state), we no longer
      // intercept — the user is free to visit any page.
      if (!isCompleted && isExpeditionComplete(user.email)) {
        setTimeout(() => router.push('/finish'), 1000);
      }
    };
    window.addEventListener('feedbackSubmitted', handler);
    return () => window.removeEventListener('feedbackSubmitted', handler);
  }, [user, isCompleted, router]);

  return null;
}
