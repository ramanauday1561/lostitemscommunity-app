// Minimal service worker. It exists so browsers treat the site as an installable app (Chrome wants one) and as the
// place web push will plug in later. It deliberately caches nothing: every request goes to the network, so a new
// deploy is picked up immediately.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* network passthrough */ });
