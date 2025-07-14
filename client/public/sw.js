// Enhanced PWA Service Worker v3.0
const VERSION = '3.0';
const CACHE_NAME = `pxd-v${VERSION}`;
const STATIC_CACHE = `pxd-static-v${VERSION}`;
const RUNTIME_CACHE = `pxd-runtime-v${VERSION}`;
const IMAGES_CACHE = `pxd-images-v${VERSION}`;
const API_CACHE = `pxd-api-v${VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.svg',
  '/logo-icon.svg',
  '/logo.svg',
  '/images/default-poster.svg',
  '/placeholder-portrait.svg',
  '/offline.html'
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/movies',
  '/api/categories',
  '/api/countries',
  '/api/user/preferences'
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  [STATIC_CACHE]: 50,
  [RUNTIME_CACHE]: 100,
  [IMAGES_CACHE]: 200,
  [API_CACHE]: 50
};

// Utility functions
async function cleanupCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

async function addToCache(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  await cleanupCache(cacheName, MAX_CACHE_SIZE[cacheName]);
}

// Install service worker
self.addEventListener('install', function(event) {
  console.log('PWA Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('PWA Service Worker activating...');
  
  const cacheWhitelist = [STATIC_CACHE, RUNTIME_CACHE, IMAGES_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      caches.keys().then(function(cacheNames) {
        console.log('Cleaning up old caches...');
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Enhanced fetch event with smart caching strategies
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request, url));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request, url));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request, url));
  } else {
    event.respondWith(handleNavigationRequest(request, url));
  }
});

// Check if request is for an image
function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

// Check if request is for a static asset
function isStaticAsset(url) {
  return /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname) || 
         STATIC_ASSETS.some(asset => url.pathname === asset);
}

// Handle API requests with network-first strategy
async function handleApiRequest(request, url) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
      await addToCache(API_CACHE, request, networkResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to response headers
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From', 'cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return offline response for API calls
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Không có kết nối mạng' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request, url) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await addToCache(IMAGES_CACHE, request, networkResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return default image for failed image requests
    return caches.match('/images/default-poster.svg') || 
           new Response('', { status: 404 });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request, url) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await addToCache(STATIC_CACHE, request, networkResponse);
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request, url) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.mode === 'navigate') {
      await addToCache(RUNTIME_CACHE, request, networkResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version or offline page
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || 
             caches.match('/') || 
             new Response(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Phim Xuyên Đêm</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      text-align: center; 
      padding: 50px 20px; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
      color: #e2e8f0; 
      min-height: 100vh;
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .container {
      max-width: 500px;
      background: rgba(30, 41, 59, 0.8);
      padding: 40px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    h1 { 
      color: #ef4444; 
      font-size: 2.5rem;
      margin-bottom: 20px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #cbd5e1;
    }
    button { 
      background: linear-gradient(45deg, #3b82f6, #1d4ed8); 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📱</div>
    <h1>Bạn đang offline</h1>
    <p>Không thể kết nối đến Phim Xuyên Đêm. Vui lòng kiểm tra kết nối mạng và thử lại.</p>
    <button onclick="location.reload()">Thử lại</button>
  </div>
</body>
</html>`, { 
               status: 503, 
               headers: { 'Content-Type': 'text/html; charset=utf-8' }
             });
    }
    
    return new Response('', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued actions when back online
    const syncData = await self.registration.sync.getTags();
    console.log('Background sync triggered:', syncData);
    
    // Notify clients that we're back online
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACK_ONLINE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Có phim mới được cập nhật!',
    icon: '/logo-icon.svg',
    badge: '/logo-icon.svg',
    image: data.image,
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Xem ngay',
        icon: '/logo-icon.svg'
      },
      {
        action: 'close',
        title: 'Đóng'
      }
    ],
    tag: data.tag || 'movie-update',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Phim Xuyên Đêm', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll().then(function(clients) {
      // Check if there's already a window open
      for (let client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Message handling from main thread
self.addEventListener('message', function(event) {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLAIM_CLIENTS':
      self.clients.claim();
      break;
      
    case 'CACHE_MOVIE':
      event.waitUntil(cacheMovieData(data));
      break;
      
    case 'GET_CACHE_SIZE':
      event.waitUntil(getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      }));
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      }));
      break;
      
    case 'CHECK_NETWORK':
      // Test network connectivity
      fetch('/api/health', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          event.ports[0].postMessage({ isOnline: true });
        })
        .catch(() => {
          event.ports[0].postMessage({ isOnline: false });
        });
      break;
  }
});

// Cache movie data for offline viewing
async function cacheMovieData(movieData) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const movieUrl = `/movie/${movieData.slug}`;
    
    // Cache movie page
    await cache.put(movieUrl, new Response(JSON.stringify(movieData), {
      headers: { 'Content-Type': 'application/json' }
    }));
    
    // Cache movie poster
    if (movieData.poster_url) {
      await fetch(movieData.poster_url).then(response => {
        if (response.ok) {
          return addToCache(IMAGES_CACHE, movieData.poster_url, response);
        }
      }).catch(() => {});
    }
    
    console.log('Movie cached for offline viewing:', movieData.name);
  } catch (error) {
    console.error('Failed to cache movie:', error);
  }
}

// Get total cache size
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}