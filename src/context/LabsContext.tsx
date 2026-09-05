'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { ExpeditionLab } from '@/lib/expeditionData';
import { setLabsCache } from '@/lib/expeditionStore';

interface LabsContextType {
  labs: Record<string, ExpeditionLab>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LabsContext = createContext<LabsContextType | undefined>(undefined);

const LABS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastFetchTimestamp = 0;
let cachedLabsData: Record<string, ExpeditionLab> | null = null;

export function LabsProvider({ children }: { children: ReactNode }) {
  const [labs, setLabs] = useState<Record<string, ExpeditionLab>>(() => cachedLabsData || {});
  const [loading, setLoading] = useState(() => !cachedLabsData);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cachedLabsData && now - lastFetchTimestamp < LABS_CACHE_TTL_MS) {
      setLabs(cachedLabsData);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/labs');
      if (!res.ok) throw new Error('Failed to load labs');
      const data = await res.json();
      const fetched = (data?.labs ?? {}) as Record<string, ExpeditionLab>;
      // Fill the module cache so the static `expeditionLabs` proxy and the
      // completion helpers read the server-side (admin-edited) data.
      cachedLabsData = fetched;
      lastFetchTimestamp = Date.now();
      setLabsCache(fetched);
      setLabs(fetched);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load labs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleLabsUpdated = (e: Event) => {
      const custom = e as CustomEvent<Record<string, ExpeditionLab>>;
      if (custom.detail) {
        cachedLabsData = custom.detail;
        lastFetchTimestamp = Date.now();
        setLabs(custom.detail);
      } else {
        refresh(true);
      }
    };

    window.addEventListener('labsUpdated', handleLabsUpdated);

    return () => {
      window.removeEventListener('labsUpdated', handleLabsUpdated);
    };
  }, [refresh]);

  return (
    <LabsContext.Provider value={{ labs, loading, error, refresh }}>
      {children}
    </LabsContext.Provider>
  );
}

export function useLabs(): LabsContextType {
  const ctx = useContext(LabsContext);
  if (!ctx) throw new Error('useLabs must be used within a LabsProvider');
  return ctx;
}