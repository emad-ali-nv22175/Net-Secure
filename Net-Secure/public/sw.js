const CACHE_NAME = 'net-secure-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/globals.css',
];

const securityPaths = ['/encryption', '/decryption'];

// Custom response handler for security-sensitive routes
const handleSecurityResponse = (event) => {
  if (securityPaths.some(path => event.request.url.includes(path))) {
    return fetch(event.request);
  }
  return null;
};

// Install event - cache basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - with special handling for security routes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    handleSecurityResponse(event) || 
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Handle file compression in background
self.addEventListener('message', (event) => {
  if (event.data.type === 'COMPRESS_FILE') {
    // Compression worker logic
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'COMPRESSION_PROGRESS',
          progress: 100,
          status: 'complete'
        });
      });
    });
  }
});