// Service Worker for TechX Expedition: Cache-first for static fonts and textures, network-first for navigation
const CACHE_NAME = 'techx-expedition-v1';

const STATIC_PRECACHE = [
  '/',
  '/site.webmanifest',
  '/favicon.ico',
  '/assets/images/worn-parchment-bg.webp',
  '/assets/images/avery-pirate-coin.webp',
  '/assets/images/review-card.webp',
  '/assets/images/journal-spread-lab1.jpg',
  '/assets/images/journal-spread-lab2.jpg',
  '/assets/images/journal-spread-lab3.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_PRECACHE).catch((err) => {
          console.warn('[SW] Pre-cache partial fail:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass non-GET and API calls completely
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Video streams should not be cached in SW cache (they use HTTP range requests)
  if (url.pathname.endsWith('.mp4') || url.pathname.includes('/videos/')) {
    return;
  }

  // 3. Static assets (fonts, WebP images, JS/CSS bundles): Cache-first with background revalidation
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cache immediately, optionally revalidate in background
          return cached;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Page navigation / HTML: Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
  }
});
