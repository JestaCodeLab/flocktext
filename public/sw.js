// Intentionally no caching: the app only needs a service worker (with a fetch
// handler) so browsers treat it as installable. Every request goes to the network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
