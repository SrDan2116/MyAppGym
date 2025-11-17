
document.addEventListener('DOMContentLoaded', () => {

    let db; // Variable para la base de datos

    // 1. Abrir (o crear) la base de datos
    // Subimos la versión a 2 para que se actualice la estructura
    const request = indexedDB.open('GymAppDB', 2);

    // 2. Manejar errores
    request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event);
    };

    // 3. Este evento se ejecuta si la versión cambia (o es la primera vez)
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        console.log('Actualizando la base de datos (onupgradeneeded)');

        // Borrar la "tabla" de notas si existía (limpieza)
        if (db.objectStoreNames.contains('notas')) {
            db.deleteObjectStore('notas');
            console.log('Almacén "notas" eliminado.');
        }

        // Crear el almacén para las PLANTILLAS de rutinas
        if (!db.objectStoreNames.contains('rutinas')) {
            db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
            console.log('Almacén "rutinas" creado.');
        }

        // Crear el almacén para los REGISTROS diarios
        if (!db.objectStoreNames.contains('registros')) {
            // Usaremos la fecha (ej. '2025-11-17') como la clave
            db.createObjectStore('registros', { keyPath: 'fecha' });
            console.log('Almacén "registros" creado.');
        }
    };

    // 4. Cuando la BD se abre correctamente
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos GymAppDB abierta exitosamente.');
        // Aquí llamaremos a funciones para mostrar la UI, ej:
        // cargarRutinasExistentes();
    };

    // --- A PARTIR DE AQUÍ IRÁ NUESTRA LÓGICA ---
    // (Por ahora lo dejamos listo)

});