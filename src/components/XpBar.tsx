'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { useRouter, usePathname } from 'next/navigation';

const TOTAL_PRODUCTS = 26;

export default function XpBar() {
  const { user } = useUser();
  const { isCompleted } = useCompletion();
  const router = useRouter();
  const pathname = usePathname();
  const [feedbackCount, setFeedbackCount] = useState(0);

  useEffect(() => {
    if (user) {
      const updateCount = () => {
        const userStorageKey = `submittedFeedback_${user.email}`;
        const storedSubmissions = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
        const count = storedSubmissions.length;
        setFeedbackCount(count);

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

  // Hide on pages with dedicated bottom navigation (e.g. /labs/[labId], /finish, or when not logged in)
  if (!user || pathname?.startsWith('/labs/') || pathname === '/finish') {
    return null;
  }

  const percentage = Math.min(100, Math.round((feedbackCount / TOTAL_PRODUCTS) * 100));

  return (
    <div
      className="simple-card"
      style={{
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'calc(100% - 2rem)',
        maxWidth: '460px',
        padding: '0.65rem 1rem',
        borderRadius: '6px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.8)',
        border: '1.5px solid #A88448',
        backgroundColor: '#F3E5C8',
        backgroundImage: 'linear-gradient(135deg, #F5E8CE 0%, #E6D2AA 100%)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <div style={{ fontSize: '0.7rem', color: '#652B19', fontWeight: '800', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
          📜 OVERALL EXPEDITION PROGRESS
        </div>
        <div style={{ fontSize: '0.85rem', color: '#2C1E14', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
          {feedbackCount} / {TOTAL_PRODUCTS} Evaluated
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#D9C5A0',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #A88448',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#D4AF37',
            backgroundImage: 'linear-gradient(90deg, #B8860B 0%, #D4AF37 50%, #F3E5AB 100%)',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(212, 175, 55, 0.8)',
          }}
        />
      </div>
    </div>
  );
}