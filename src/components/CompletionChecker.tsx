'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';

export default function CompletionChecker() {
  const { user } = useUser();
  const { isCompleted } = useCompletion();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const checkCompletion = () => {
      const userStorageKey = `feedback_submitted_${user.email}`;
      const storedSubmissions = JSON.parse(localStorage.getItem(userStorageKey) || localStorage.getItem(`submittedFeedback_${user.email}`) || '[]');
      const count = storedSubmissions.length;
      
      if (count >= 15 && !isCompleted) {
        localStorage.setItem(`completion_${user.email}`, 'true');
        localStorage.setItem('completion_state', 'true');
        
        setTimeout(() => {
          router.push('/finish');
        }, 1000);
      }
    };

    // Check on mount
    checkCompletion();

    // Listen for feedback submission events
    const handleFeedbackSubmitted = () => {
      setTimeout(checkCompletion, 100); // Small delay to ensure localStorage is updated
    };

    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    
    return () => {
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, [user, isCompleted, router]);

  return null; // This component doesn't render anything
}
