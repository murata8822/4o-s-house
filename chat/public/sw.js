// Service Worker - Minimal for PWA install support
const CACHE_NAME = '4o-house-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let API calls bypass SW caching.
  if (event.request.url.includes('/api/')) return;
  if (event.request.method !== 'GET') return;

  // Always try network first for HTML/doc navigations so deploys show up quickly.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)).then((response) => {
        return response || caches.match('/');
      })
    );
    return;
  }

  // For static assets: serve cache quickly and refresh in background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((fallback) => fallback || caches.match('/')));

      return cached || fetchPromise;
    })
  );
});
