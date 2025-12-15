export function initDB() {
    return new Promise((resolve, reject) => {
        // ¡IMPORTANTE! Subimos la versión a 5 para que el navegador detecte el cambio
        const request = indexedDB.open('GymAppDB', 5);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event);
            reject(event);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('Actualizando la base de datos (onupgradeneeded)');
            
            // Tablas existentes
            if (!db.objectStoreNames.contains('rutinas')) {
                db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('registros')) {
                db.createObjectStore('registros', { keyPath: 'fecha' }); // O 'id' si usas IDs compuestos
            }
            if (!db.objectStoreNames.contains('medidas')) {
                db.createObjectStore('medidas', { keyPath: 'fecha' });
            }
            
            // ¡NUEVO! Tabla para las dietas
            if (!db.objectStoreNames.contains('dietas')) {
                // Usamos 'id' como clave (ahí guardaremos la fecha "2023-12-15")
                db.createObjectStore('dietas', { keyPath: 'id' });
                console.log('Tabla "dietas" creada correctamente.');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log('Base de datos GymAppDB (v5) abierta.');
            resolve(db);
        };
    });
}