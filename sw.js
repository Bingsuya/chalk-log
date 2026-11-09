// Offline support: keep the app shell cached; always try the network first for the page and its settings so updates arrive.
const VERSION = 'chalklog-v4';
const SHELL = ['./', './index.html', './config.js', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const networkFirst = (req, cacheKey) => fetch(req).then(res => {
  if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(cacheKey || req, copy)); }
  return res;
}).catch(() => caches.match(cacheKey || req));
const staleWhileRevalidate = req => caches.open(VERSION).then(c => c.match(req).then(hit => {
  const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, './index.html')); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net') { e.respondWith(staleWhileRevalidate(req)); return; }
  if (url.origin === location.origin) {
    if (url.pathname.endsWith('/config.js')) { e.respondWith(networkFirst(req)); return; }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
  // everything else (e.g. the Supabase API) goes straight to the network
});
