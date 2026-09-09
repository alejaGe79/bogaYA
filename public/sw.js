const CACHE_NAME = 'bogaya-v1';
const FILES = [
    '/bogaya/',
    '/bogaya/public/index.html',
    '/bogaya/public/css/style.css',
    '/bogaya/public/js/app.js',
    '/bogaya/public/js/api.js',
    '/bogaya/public/js/auth.js'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});