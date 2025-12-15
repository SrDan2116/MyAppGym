export function initDB() {
    return new Promise((resolve, reject) => {
        // CAMBIO CRÍTICO: Subimos a versión 7 para superar a la versión 6 que ya existe
        const request = indexedDB.open('GymAppDB', 7);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event);
            reject(event);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Actualizando la base de datos (onupgradeneeded)');
            
            // Verificamos y creamos las tablas si no existen
            if (!db.objectStoreNames.contains('rutinas')) {
                db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('registros')) {
                db.createObjectStore('registros', { keyPath: 'fecha' });
            }
            if (!db.objectStoreNames.contains('medidas')) {
                db.createObjectStore('medidas', { keyPath: 'fecha' });
            }
            if (!db.objectStoreNames.contains('dietas')) {
                db.createObjectStore('dietas', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('Base de datos GymAppDB (v7) abierta.');
            resolve(db);
        };
    });
}