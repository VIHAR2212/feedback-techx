'use client';

// ExpeditionContext replaces the original AchievementContext. It powers the
// "FeedbackResultCard" toast and the (optional) ClueReveal modal that
// appear after a user submits a discovery. Toasts auto-dismiss; clues
// require the user to dismiss them.

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export interface FeedbackResult {
  id: number;
  title: string;
  subtitle: string;
  productId?: string;
  productName?: string;
  rating?: number;
  // What the random reveal produced: a clue or "no clue".
  reveal?: { kind: 'clue' | 'empty'; clueId?: string; clueTitle?: string; clueBody?: string } | null;
  duration?: number; // ms before auto-dismiss; 0 = sticky
}

interface ExpeditionContextType {
  results: FeedbackResult[];
  addResult: (result: Omit<FeedbackResult, 'id'>) => void;
  dismissResult: (id: number) => void;
}

const ExpeditionContext = createContext<ExpeditionContextType | undefined>(undefined);

export function ExpeditionProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<FeedbackResult[]>([]);

  const addResult = useCallback((result: Omit<FeedbackResult, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setResults((prev) => [{ ...result, id }, ...prev]);
    if (result.duration && result.duration > 0) {
      setTimeout(() => {
        setResults((prev) => prev.filter((r) => r.id !== id));
      }, result.duration);
    }
  }, []);

  const dismissResult = useCallback((id: number) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <ExpeditionContext.Provider value={{ results, addResult, dismissResult }}>
      {children}
    </ExpeditionContext.Provider>
  );
}

export function useExpedition() {
  const context = useContext(ExpeditionContext);
  if (context === undefined) {
    throw new Error('useExpedition must be used within an ExpeditionProvider');
  }
  return context;
}
