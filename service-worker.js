const CACHE_NAME = 'notas-cache-v1';
// Lista de archivos que queremos guardar en caché
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'app.js'
    // AÑADE AQUÍ LOS ÍCONOS SI LOS PONES
];

// Evento 'install': Se dispara cuando el SW se instala
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                // Guardar todos nuestros archivos en el caché
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento 'fetch': Se dispara cada vez que la app pide un archivo (como un .css o una imagen)
self.addEventListener('fetch', event => {
    event.respondWith(
        // Intentar buscar el archivo en el caché primero
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Si está en caché, lo devolvemos
                    return response;
                }
                // Si no está, vamos a la red a buscarlo
                return fetch(event.request);
            })
    );
});