'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export interface Achievement {
  id: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  duration?: number;
}

interface AchievementContextType {
  addAchievement: (achievement: Omit<Achievement, 'id'>) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);
export const AchievementDispatchContext = createContext<React.Dispatch<React.SetStateAction<Achievement[]>> | null>(null);
export const AchievementsContext = createContext<Achievement[]>([]);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const addAchievement = useCallback((achievement: Omit<Achievement, 'id'>) => {
    const newAchievement = { ...achievement, id: Date.now() };
    setAchievements(prev => [newAchievement, ...prev]);
  }, []);

  return (
    <AchievementContext.Provider value={{ addAchievement }}>
      <AchievementsContext.Provider value={achievements}>
        <AchievementDispatchContext.Provider value={setAchievements}>
          {children}
        </AchievementDispatchContext.Provider>
      </AchievementsContext.Provider>
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
}