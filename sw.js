const CACHE = 'lab-v3-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/themes.css',
  './css/components.css',
  './css/layout.css',
  './js/state.js',
  './js/app.js',
  './js/achievements.js',
  './modules/home.js',
  './modules/kanban.js',
  './modules/ritmos.js',
  './modules/roadmap.js',
  './modules/capture.js',
  './modules/metrics.js',
  './modules/profile.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
