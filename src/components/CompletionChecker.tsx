'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { expeditionLabs, isLabCompleted } from '@/lib/expeditionData';

export default function CompletionChecker() {
  const { user } = useUser();
  const { isCompleted } = useCompletion();
  const router = useRouter();
  const pathname = usePathname();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending redirect when navigating/unmounting so we never
  // hijack navigation after the component is gone.
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    // Never hijack or force redirect when user is browsing leaderboard, labs, admin, or certificate views
    const safePaths = ['/leaderboard', '/admin', '/finish', '/labs', '/certificate'];
    if (pathname && safePaths.some((p) => pathname.startsWith(p))) {
      return;
    }

    const checkCompletion = () => {
      const labKeys = Object.keys(expeditionLabs);
      const allDone = labKeys.length > 0 && labKeys.every((labId) => isLabCompleted(labId, user.email));

      if (allDone && !isCompleted) {
        localStorage.setItem(`completion_${user.email}`, 'true');
        redirectTimerRef.current = setTimeout(() => {
          router.push('/finish');
        }, 1000);
      }
    };

    // Listen only when feedback is actively submitted
    const handleFeedbackSubmitted = () => {
      setTimeout(checkCompletion, 100);
    };

    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);

    return () => {
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, [user, isCompleted, router, pathname]);

  return null;
}
