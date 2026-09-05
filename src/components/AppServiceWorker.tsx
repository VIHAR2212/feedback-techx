'use client';

import { useEffect } from 'react';
import { initOfflineQueueAutoSync } from '@/lib/offline-queue';

export default function AppServiceWorker() {
  useEffect(() => {
    // 1. Initialize offline feedback auto-sync on mount
    initOfflineQueueAutoSync();

    // 2. Register service worker for offline asset caching in production / browser
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] ServiceWorker registered with scope:', registration.scope);
          })
          .catch((err) => {
            // Non-fatal if service workers are disabled
            console.debug('[SW] Registration notice:', err);
          });
      });
    }
  }, []);

  return null;
}
