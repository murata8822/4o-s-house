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
  // Never cache HTML navigations. Auth redirects must stay network-fresh.
  if (event.request.mode === 'navigate') {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Cache only static asset requests
  const staticDestinations = ['script', 'style', 'image', 'font'];
  if (!staticDestinations.includes(event.request.destination)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
