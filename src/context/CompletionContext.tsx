'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { useLabs } from './LabsContext';
import { isLabCompleted as checkLabDone } from '@/lib/expeditionData';

interface CompletionContextType {
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  checkCompletion: () => boolean;
  isLabCompleted?: (labId: string) => boolean;
  isLabUnlocked?: (labId: string) => boolean;
  shards?: string[];
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

export function CompletionProvider({ children }: { children: ReactNode }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const { user } = useUser();
  useLabs(); // re-evaluate completion when admin edits labs

  const checkCompletion = useCallback(() => {
    if (!user?.email) return false;
    try {
      const userStorageKey = `submittedFeedback_${user.email}`;
      const storedSubmissions = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
      return storedSubmissions.length >= 25;
    } catch {
      return false;
    }
  }, [user]);

  // Check completion status when user changes
  useEffect(() => {
    if (user?.email) {
      const storedCompletion = localStorage.getItem(`completion_${user.email}`);
      const globalCompletion = localStorage.getItem('completion_state');

      if (storedCompletion === 'true' || globalCompletion === 'true') {
        setIsCompleted(true);
      } else {
        const completed = checkCompletion();
        setIsCompleted(completed);
        if (completed) {
          localStorage.setItem(`completion_${user.email}`, 'true');
        }
      }
    } else {
      setIsCompleted(false);
    }
  }, [user, checkCompletion]);

  // Listen for feedback submission events to update completion status
  useEffect(() => {
    if (!user?.email) return;

    const updateCompletion = () => {
      const completed = checkCompletion();
      setIsCompleted(completed);
      if (completed) {
        localStorage.setItem(`completion_${user.email}`, 'true');
      }
    };

    window.addEventListener('feedbackSubmitted', updateCompletion);
    return () => {
      window.removeEventListener('feedbackSubmitted', updateCompletion);
    };
  }, [user, checkCompletion]);

  const isLabCompleted = useCallback(
    (labId: string) => {
      if (!user?.email) return false;
      return checkLabDone(labId, user.email);
    },
    [user]
  );

  const isLabUnlocked = useCallback(
    (_labId: string) => {
      return true; // All labs unlocked in open exploration
    },
    []
  );

  return (
    <CompletionContext.Provider
      value={{
        isCompleted,
        setIsCompleted,
        checkCompletion,
        isLabCompleted,
        isLabUnlocked,
        shards: ['a', 'c', 'd'].filter((id) => (user?.email ? checkLabDone(id, user.email) : false)),
      }}
    >
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion() {
  const context = useContext(CompletionContext);
  if (context === undefined) {
    throw new Error('useCompletion must be used within a CompletionProvider');
  }
  return context;
}
