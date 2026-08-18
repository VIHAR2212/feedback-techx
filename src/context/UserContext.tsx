'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// Lightweight expedition-user shape used by the landing page session only.
// The full ExpeditionUser shape (with progress fields) lives in localStorage
// keys suffixed by the user's email, and is read by CompletionContext /
// pages as needed. This split mirrors the original project so the rest of
// the codebase doesn't change shape.
export interface User {
  name: string;
  department: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('user_session');
        const sessionTimestamp = localStorage.getItem('user_session_timestamp');

        if (storedUser && sessionTimestamp) {
          const userData = JSON.parse(storedUser);
          const timestamp = parseInt(sessionTimestamp);
          const now = Date.now();
          const sessionTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days

          if (now - timestamp < sessionTimeout) {
            setUser(userData);
          } else {
            localStorage.removeItem('user_session');
            localStorage.removeItem('user_session_timestamp');
          }
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
        localStorage.removeItem('user_session');
        localStorage.removeItem('user_session_timestamp');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user_session', JSON.stringify(userData));
    localStorage.setItem('user_session_timestamp', Date.now().toString());
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_session_timestamp');
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
