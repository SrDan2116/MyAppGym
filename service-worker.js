// 1. CAMBIA EL NOMBRE DEL CACHÉ
const CACHE_NAME = 'notas-cache-v12';

// 2. AÑADE TODOS LOS ARCHIVOS A LA LISTA
const urlsToCache = [
    './',
    'index.html',
    'style.css',
    'manifest.json',
    'js/main.js',             // <-- AÑADIR
    'js/db.js',               // <-- AÑADIR
    'js/utils.js',            // <-- AÑADIR
    'js/ui_rutinas.js',       // <-- AÑADIR
    'js/ui_calendario.js',    // <-- AÑADIR
    'js/ui_peso.js'           // <-- AÑADIR
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
