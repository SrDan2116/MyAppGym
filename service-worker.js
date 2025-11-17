// 1. CAMBIA EL NOMBRE DEL CACHÉ
const CACHE_NAME = 'notas-cache-v10';

// 2. AÑADE TODOS LOS ARCHIVOS A LA LISTA
const urlsToCache = [
    './', // Esto es clave: representa la raíz de tu app
    'index.html',
    'style.css',
    'app.js',
    'manifest.json'
    // Si creaste los íconos, añádelos aquí también:
    // 'images/icon-192.png',
    // 'images/icon-512.png'
];

// Evento 'install': Se dispara cuando el SW se instala
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache v2 abierto y archivos guardados');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento 'fetch': Se dispara cada vez que la app pide un archivo
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en caché, lo devolvemos
                if (response) {
                    return response;
                }
                // Si no está, vamos a la red a buscarlo
                return fetch(event.request);
            })
    );
});

// Evento 'activate': Limpia los cachés antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Si el nombre del caché no es el nuevo (v2), bórralo
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
