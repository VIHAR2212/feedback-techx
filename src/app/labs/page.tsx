'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './page.module.css';

// --- THIS DATA HAS BEEN UPDATED ---
const labs = [
  { labId: 'a', labName: 'LAB 308-A' },
  { labId: 'c', labName: 'LAB 308-C' },
  { labId: 'd', labName: 'LAB 308-D' },
];

export default function LabsPage() {
  const router = useRouter();
  const { user, logout } = useUser();

  // Check if user has already completed all feedback
  useEffect(() => {
    if (user) {
      const userFeedbackKey = `submittedFeedback_${user.email}`;
      const submittedFeedback = JSON.parse(localStorage.getItem(userFeedbackKey) || '[]');
      const hasCompleted = submittedFeedback.length >= 25;

      if (hasCompleted) {
        router.push('/finish');
      }
    }
  }, [user, router]);

  const handleLabClick = (labId: string) => {
    const clickSound = new Audio('/sounds/labs.mp3');
    clickSound.play();

    setTimeout(() => {
      router.push(`/labs/${labId}`);
    }, 200);
  };

  return (
    <main>
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <button 
              onClick={() => router.push('/leaderboard')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#FFD700',
                color: '#000',
                border: '4px outset #a0a0a0',
                fontSize: '1rem',
                fontFamily: 'var(--font-minecraft)',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏆 Leaderboard
            </button>
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem' }}>Choose a Lab</h1>
            <p style={{ color: '#a0a0a0' }}>Select a lab to view its products and give feedback.</p>
          </div>
          <div>
            {user && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Logged in as: {user.name}
                </p>
                <button 
                  onClick={logout}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8B0000',
                    color: 'white',
                    border: '2px outset #a0a0a0',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-minecraft)',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.labListContainer}>
        {labs.map((lab) => (
          <button
            key={lab.labId}
            onClick={() => handleLabClick(lab.labId)}
            className={styles.labLink}
          >
            {lab.labName}
          </button>
        ))}
      </div>
    </main>
  );
}

