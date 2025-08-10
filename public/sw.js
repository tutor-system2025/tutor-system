const CACHE_NAME = 'tutor-system-v1.0.1';
const urlsToCache = [
  '/',
  '/script.js',
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
        // Return cached version or fetch from network
        if (response) {
          // Check if the cached version is still valid
          const cacheTime = response.headers.get('sw-cache-time');
          const now = Date.now();
          
          // If cache is older than 1 hour, fetch fresh version
          if (!cacheTime || (now - parseInt(cacheTime)) > 3600000) {
            return fetch(event.request).then(fetchResponse => {
              // Cache the fresh response
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                const headers = new Headers(fetchResponse.headers);
                headers.append('sw-cache-time', now.toString());
                const responseWithTime = new Response(fetchResponse.body, {
                  status: fetchResponse.status,
                  statusText: fetchResponse.statusText,
                  headers: headers
                });
                cache.put(event.request, responseWithTime);
              });
              return fetchResponse;
            }).catch(() => {
              // If fetch fails, return cached version
              return response;
            });
          }
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request).then(fetchResponse => {
          // Don't cache non-GET requests
          if (event.request.method !== 'GET') {
            return fetchResponse;
          }
          
          // Cache the response
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            const headers = new Headers(fetchResponse.headers);
            headers.append('sw-cache-time', Date.now().toString());
            const responseWithTime = new Response(fetchResponse.body, {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              headers: headers
            });
            cache.put(event.request, responseWithTime);
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