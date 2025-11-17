// CAMBIA v12 por v13
const CACHE_NAME = 'notas-cache-v19'; 

// ¡ACTUALIZA ESTA LISTA!
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
    
    // ¡NUEVO! Añadimos los CDNs al caché
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',

    'images/icon-192.png',
    'images/icon-512.png'
    // Nota: Las 'fuentes' que pide bootstrap-icons.min.css se cachearán dinámicamente
];

// Evento 'install': Se dispara cuando el SW se instala
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache v13 abierto y archivos base guardados');
                // Guardar todos nuestros archivos en el caché
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento 'fetch': Se dispara cada vez que la app pide un archivo
// ¡Esta función está MODIFICADA para manejar CDNs!
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Si la petición es para las fuentes de Bootstrap (vienen de otro dominio)
    // O para el propio Chart.js
    if (requestUrl.origin === 'https://cdn.jsdelivr.net') {
        event.respondWith(
            caches.match(event.request).then(response => {
                // Si está en caché, lo devolvemos
                return response || fetch(event.request).then(fetchResponse => {
                    // Si no está, lo buscamos en la red Y LO GUARDAMOS
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, fetchResponse.clone());
                        return fetchResponse;
                    });
                });
            })
        );
        return; // Salir de la función aquí
    }

    // Lógica de caché normal (primero caché, si no, red) para el resto
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
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
                    // Si el nombre del caché no es el nuevo (v13), bórralo
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});