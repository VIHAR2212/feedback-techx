'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useAchievement } from '@/context/AchievementContext';
import HeartRating from '@/components/HeartRating';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { addAchievement } = useAchievement();
  const tableId = params.tableId as string;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This ref safely handles the setIsSubmitting call
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // This effect handles redirecting if user is not logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("User information not found. Please return to the homepage.");
      return;
    }
    if (rating === 0) {
      alert('A rating is required!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.name,
          studentEmail: user.email,
          studentDepartment: user.department,
          rating,
          comment,
          tableId,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) { throw new Error('Failed to submit feedback'); }
      
      const userStorageKey = `submittedFeedback_${user.email}`;
      const submitted = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
      
      // Only update localStorage and dispatch the event for a new submission
      if (!submitted.includes(tableId)) {
        submitted.push(tableId);
        localStorage.setItem(userStorageKey, JSON.stringify(submitted));
        
        // Check if this completes all feedback
        if (submitted.length >= 25) {
          localStorage.setItem(`completion_${user.email}`, 'true');
          localStorage.setItem('completion_state', 'true');
        }
        
        // Dispatch event to update XP bar and trigger redirect
        window.dispatchEvent(new CustomEvent('feedbackSubmitted', { 
          detail: { completed: submitted.length >= 25 } 
        }));
      }
      
      // Play the achievement sound effect
      const achievementSound = new Audio('/sounds/achievement.mp3');
      achievementSound.play();

      addAchievement({
        title: 'Advancement Made!',
        subtitle: 'Feedback Crafter',
        imageUrl: '/images/image.png'
      });
      
      // Check if all feedback is completed
      const userStorageKey2 = `submittedFeedback_${user.email}`;
      const submitted2 = JSON.parse(localStorage.getItem(userStorageKey2) || '[]');
      
      if (submitted2.length >= 25) {
        setTimeout(() => {
          router.push('/finish');
        }, 1000);
      } else {
        // Otherwise, redirect back to lab page
        setTimeout(() => {
          const labId = tableId.charAt(0); 
          router.push(`/labs/${labId}`);   
        }, 500);
      }

    } catch (error) {
      console.error("Submission Error:", error);
      alert('🔥 Something went wrong!');
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const formStyle: React.CSSProperties = { maxWidth: '600px', margin: 'auto', padding: '2rem', backgroundColor: '#c6c6c6', border: '4px solid', borderColor: '#e0e0e0 #585858 #585858 #e0e0e0', color: '#333' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#373737', border: '2px inset #585858', color: 'white', boxSizing: 'border-box', fontFamily: 'var(--font-minecraft)' };
  const buttonStyle: React.CSSProperties = { width: '100%', padding: '1rem', backgroundColor: '#5E8D4A', color: 'white', border: '4px outset #a0a0a0', fontSize: '1.25rem', fontFamily: 'var(--font-minecraft)' };

  if (!user) {
    return <p style={{ textAlign: 'center', fontFamily: 'var(--font-minecraft)', fontSize: '1.5rem', marginTop: '20vh' }}>Redirecting to login...</p>;
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={formStyle}>
        <h1 style={{ textAlign: 'center' }}>
          Feedback for: {decodeURIComponent(tableId).replace(/-/g, ' ')}
        </h1>
        <p style={{textAlign: 'center', color: '#555'}}>Submitting as: {user.name} ({user.email})</p>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', margin: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem' }}>Your Rating:</label>
            <HeartRating rating={rating} setRating={setRating} />
          </div>
          <textarea placeholder="Your thoughts here... (optional)" value={comment} onChange={(e) => setComment(e.target.value)} style={inputStyle} rows={4} />
          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </main>
  );
}

