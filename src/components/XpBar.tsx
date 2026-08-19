'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { useRouter } from 'next/navigation';
import styles from './XpBar.module.css';

const TOTAL_PRODUCTS = 26;
const TOTAL_SEGMENTS = 20;

export default function XpBar() {
  const { user } = useUser();
  const { isCompleted } = useCompletion();
  const router = useRouter();
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    if (user) {
      const updateCount = () => {
        const userStorageKey = `submittedFeedback_${user.email}`;
        const storedSubmissions = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
        const count = storedSubmissions.length;
        setFeedbackCount(count);

        // Check for completion and redirect
        if (count >= TOTAL_PRODUCTS) {
          setTimeout(() => {
            router.push('/finish');
          }, 500);
        }
      };

      updateCount();
      window.addEventListener('feedbackSubmitted', updateCount);
      return () => {
        window.removeEventListener('feedbackSubmitted', updateCount);
      };
    }
  }, [user, router, isCompleted]);

  const filledSegments = Math.round((feedbackCount / TOTAL_PRODUCTS) * TOTAL_SEGMENTS);

  // We still want to show the bar on other pages, so we don't return null if !user
  if (!user) {
    return null;
  }

  return (
    <div className={styles.xpContainer}>
      <div className={styles.xpBar}>
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, index) => (
          <div
            key={index}
            className={`${styles.xpSegment} ${index < filledSegments ? styles.filled : ''}`}
          />
        ))}
      </div>
      <div className={styles.progressText}>
        Progress: {feedbackCount} / {TOTAL_PRODUCTS}
      </div>
      {feedbackCount < TOTAL_PRODUCTS && (
        <p className={styles.magicText}>
          Complete all the feedbacks to see the magic !!!
        </p>
      )}
    </div>
  );
}