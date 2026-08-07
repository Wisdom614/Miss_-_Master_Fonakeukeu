// This worker intentionally does not cache application files. Vite fingerprints
// build assets, while Firebase serves the HTML shell without caching, so every
// deployment can take effect as soon as the browser checks for an update.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
