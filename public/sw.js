const CACHE_NAME = 'tutor-system-v1.0.5';
const urlsToCache = [
  '/',
  '/index.html'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // For versioned files (like script.js?v=1.0.4), always fetch from network
        if (event.request.url.includes('?v=')) {
          return fetch(event.request).then(fetchResponse => {
            // Don't cache versioned files to prevent cache conflicts
            return fetchResponse;
          }).catch(() => {
            // If network fails, fall back to cached version if available
            return response || fetch(event.request);
          });
        }
        
        // Return cached version for non-versioned files
        if (response) {
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request).then(fetchResponse => {
          // Don't cache non-GET requests or non-successful responses
          if (event.request.method !== 'GET' || !fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          
          // Cache the response (only for non-versioned files)
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Clearing all caches');
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