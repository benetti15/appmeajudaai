// Enhanced Service Worker for better performance
const CACHE_NAME = 'meajuda-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png',
  '/lovable-uploads/bcdf9267-23f4-43c5-9f60-203b73298aa4.png'
];

// Network-first strategy for API calls
const NETWORK_FIRST = [
  'https://seqrtrcpivbneosbtben.supabase.co'
];

// Cache-first strategy for static assets
const CACHE_FIRST = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.woff',
  '.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (NETWORK_FIRST.some(pattern => url.href.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (CACHE_FIRST.some(ext => url.pathname.includes(ext))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first for HTML pages
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued actions when back online
  console.log('Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nova notificação',
    icon: '/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png',
    badge: '/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Me Ajuda ai!', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});