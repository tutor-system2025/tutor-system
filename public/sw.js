const CACHE_NAME = 'tutor-system-v1.0.4';

// Install event - minimal caching
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Fetch event - always fetch from network, never cache
self.addEventListener('fetch', event => {
  // Skip caching for all requests - always fetch from network
  event.respondWith(
    fetch(event.request)
      .catch(error => {
        console.log('Fetch failed, falling back to network:', error);
        return fetch(event.request);
      })
  );
});

// Activate event - clean up all caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Clearing all caches via message');
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
}); 