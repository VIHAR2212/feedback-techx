'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Admin session context.
//
// Auth state is owned by the server: credentials are verified by
// POST /api/admin/login which sets an HTTP-only signed session cookie
// (guarded further by src/proxy.ts for every /api/admin/* route).
// Nothing sensitive is persisted in localStorage.

interface Admin {
  username: string;
}

interface AdminContextType {
  admin: Admin | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session from the HTTP-only cookie via a server probe.
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAdmin({ username: 'admin' });
          }
        }
      } catch (error) {
        console.error('Error restoring admin session:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setAdmin({ username: data.username || username });
      return true;
    } catch (error) {
      console.error('Error during admin login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during admin logout:', error);
    } finally {
      setAdmin(null);
    }
  };

  const isAdmin = admin !== null;

  return (
    <AdminContext.Provider value={{ admin, login, logout, isAdmin, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
