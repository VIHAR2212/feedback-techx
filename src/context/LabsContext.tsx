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

export function LabsProvider({ children }: { children: ReactNode }) {
  const [labs, setLabs] = useState<Record<string, ExpeditionLab>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/labs');
      if (!res.ok) throw new Error('Failed to load labs');
      const data = await res.json();
      const fetched = (data?.labs ?? {}) as Record<string, ExpeditionLab>;
      // Fill the module cache so the static `expeditionLabs` proxy and the
      // completion helpers read the server-side (admin-edited) data.
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
        setLabs(custom.detail);
      } else {
        refresh();
      }
    };

    window.addEventListener('labsUpdated', handleLabsUpdated);
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('labsUpdated', handleLabsUpdated);
      window.removeEventListener('focus', refresh);
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