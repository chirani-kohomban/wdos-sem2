import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// 1. Immediately activate new service worker across all active tabs
self.skipWaiting();

// 2. Automatically remove obsolete caches from older builds
cleanupOutdatedCaches();

// 3. Precache all assets (HTML, CSS, JS, seed data, icons) built by Vite
const manifest = self.__WB_MANIFEST;
if (manifest) {
  precacheAndRoute(manifest);
}

// 4. NAVIGATION FALLBACK (Crucial for Single Page Application offline mode):
// When offline and the user refreshes or navigates to any URL (/products, /workshops, /events),
// this immediately serves cached /index.html so React Router can boot and render the page!
try {
  const handler = createHandlerBoundToURL('/index.html');
  const navigationRoute = new NavigationRoute(handler, {
    denylist: [/^\/api/, /\.[a-zA-Z0-9]+$/]
  });
  registerRoute(navigationRoute);
} catch (e) {
  console.warn('Navigation fallback warning:', e);
}

// 5. RUNTIME CACHING: REST API endpoints (Network First falling back to Cache)
registerRoute(
  ({ url }) =>
    url.pathname.includes('/products') ||
    url.pathname.includes('/workshops') ||
    url.pathname.includes('/events') ||
    url.pathname.includes('/stats'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 Hours
      })
    ]
  })
);

// 6. RUNTIME CACHING: Seed JSON fallback data (/data/*.json)
registerRoute(
  ({ url }) => url.pathname.includes('/data/'),
  new StaleWhileRevalidate({
    cacheName: 'seed-data-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// 7. RUNTIME CACHING: Images (Unsplash and local media)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Days
      })
    ]
  })
);

// 8. Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('✅ Urban Harvest Hub Service Worker active and controlling all pages.');
  event.waitUntil(self.clients.claim());
});

// 9. Web Push Notifications Listener
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received in Service Worker', event);
  let title = 'Urban Harvest Hub 🌱';
  let body = 'New community update available!';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch (e) {
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now() }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 10. Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
