'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { LAB_ORDER } from '@/lib/mock-data';
import {
  isExpeditionComplete,
  loadExpeditionUser,
  recalculateProgress,
} from '@/lib/expedition-storage';

interface CompletionContextType {
  // True only when user has collected all 3 shards.
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  // Recompute from localStorage.
  checkCompletion: () => boolean;
  // Per-lab completion lookup.
  isLabCompleted: (labId: string) => boolean;
  // Per-lab unlock lookup.
  isLabUnlocked: (labId: string) => boolean;
  // Shard list.
  shards: string[];
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

export function CompletionProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [isCompleted, setIsCompleted] = useState(false);
  const [shards, setShards] = useState<string[]>([]);

  const checkCompletion = useCallback(() => {
    if (!user) return false;
    return isExpeditionComplete(user.email);
  }, [user]);

  const refresh = useCallback(() => {
    if (!user) return;
    const state = recalculateProgress(user.email);
    setShards(state.shards);
    setIsCompleted(state.isExpeditionComplete);
  }, [user]);

  // Hydrate from localStorage whenever the user changes.
  useEffect(() => {
    if (!user) {
      setShards([]);
      setIsCompleted(false);
      return;
    }
    const u = loadExpeditionUser(user.email);
    setShards(u.shards);
    setIsCompleted(u.shards.length >= LAB_ORDER.length);
  }, [user]);

  // Listen for feedback submissions and recompute.
  useEffect(() => {
    if (!user) return;
    const onUpdate = () => refresh();
    window.addEventListener('feedbackSubmitted', onUpdate);
    return () => window.removeEventListener('feedbackSubmitted', onUpdate);
  }, [user, refresh]);

  const isLabCompleted = useCallback(
    (labId: string) => {
      if (!user) return false;
      const u = loadExpeditionUser(user.email);
      return u.completedLabs.includes(labId);
    },
    [user]
  );

  const isLabUnlocked = useCallback(
    (labId: string) => {
      if (!user) return false;
      const u = loadExpeditionUser(user.email);
      return u.unlockedLabs.includes(labId);
    },
    [user]
  );

  return (
    <CompletionContext.Provider
      value={{ isCompleted, setIsCompleted, checkCompletion, isLabCompleted, isLabUnlocked, shards }}
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
