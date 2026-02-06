const CACHE_VERSION = 'v2';
const STATIC_CACHE = `elitetrack-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `elitetrack-images-${CACHE_VERSION}`;
const API_CACHE = `elitetrack-api-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, IMAGE_CACHE, API_CACHE];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/elite-logo.svg'
];

// Install — pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => !ALL_CACHES.includes(n)).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategy based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Supabase API — Network first, cache fallback (for offline)
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Images — Cache first, network fallback
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Fonts & CSS — Cache first
  if (request.destination === 'font' || request.destination === 'style' || url.hostname.includes('fonts.')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML navigation — Network first (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // JS/other assets — Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// --- Caching strategies ---

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName, timeout) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// --- Push Notifications ---

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'EliteTrack',
    body: 'Você tem uma nova atualização!',
    icon: '/icons/icon-192x192.svg',
    badge: '/elite-logo.svg',
    tag: 'elitetrack-notification',
    requireInteraction: true,
    data: { url: '/dashboard' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        return clients.openWindow?.(urlToOpen);
      })
  );
});

// --- Background Sync: Upload de fotos offline ---

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncOfflinePhotos());
  }
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncOfflinePhotos() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-photos', 'readonly');
    const store = tx.objectStore('offline-photos');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const photos = request.result;
        for (const photo of photos) {
          try {
            await fetch('/api/upload-photo', {
              method: 'POST',
              body: JSON.stringify(photo),
              headers: { 'Content-Type': 'application/json' }
            });
            // Remove from offline queue after successful upload
            const deleteTx = db.transaction('offline-photos', 'readwrite');
            deleteTx.objectStore('offline-photos').delete(photo.id);
          } catch {
            // Will retry on next sync
          }
        }
        resolve();
      };
      request.onerror = reject;
    });
  } catch (err) {
    console.error('[SW] Erro ao sincronizar fotos offline:', err);
  }
}

async function syncData() {
  console.log('[SW] Background data sync');
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('elitetrack-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-photos')) {
        db.createObjectStore('offline-photos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
