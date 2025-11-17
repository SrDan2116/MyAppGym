export function initDB() {
    return new Promise((resolve, reject) => {
        // ¡Subimos la versión a 3 por el módulo de peso!
        const request = indexedDB.open('GymAppDB', 3);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event);
            reject(event);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Actualizando la base de datos (onupgradeneeded)');
            if (!db.objectStoreNames.contains('rutinas')) {
                db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('registros')) {
                db.createObjectStore('registros', { keyPath: 'fecha' });
            }
            if (!db.objectStoreNames.contains('medidas')) {
                db.createObjectStore('medidas', { keyPath: 'fecha' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('Base de datos GymAppDB abierta.');
            resolve(db); // Devuelve la BD cuando esté lista
        };
    });
}