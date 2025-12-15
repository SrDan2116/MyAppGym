// CAMBIA v27 por v28
const CACHE_NAME = 'notas-cache-v28'; 

const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'manifest.json',
    'js/main.js',
    'js/db.js',
    'js/utils.js',
    'js/ui_rutinas.js',
    'js/ui_calendario.js',
    'js/ui_peso.js',
    'js/ui_configuracion.js',
    'js/ui_dieta.js', // ¡Este es el importante!
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'images/icon-192.png',
    'images/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache v28 abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// (Mantén el resto igual que siempre)
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === 'https://cdn.jsdelivr.net') {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request).then(fetchResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
        return; 
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});