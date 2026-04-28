const cachePWA = 'cache-v3';

const urlsToCache = [
    '/massotimer/',
    '/massotimer/index.html',
    '/massotimer/style.css',
    '/massotimer/app.js',
    '/massotimer/timer_192.png',
    '/massotimer/timer_512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cachePWA)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});