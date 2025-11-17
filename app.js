// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {

    let db; // Variable para guardar la conexión a la BD

    // 1. Abrir (o crear) la base de datos
    const request = indexedDB.open('NotasDB', 1);

    // 2. Manejar errores
    request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event);
    };

    // 3. Este evento solo corre si la BD es nueva o la versión cambia
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        // Crear la "tabla" (se llama 'object store')
        const store = db.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
        console.log('Base de datos y almacén de notas creados!');
    };

    // 4. Cuando la BD se abre correctamente
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos abierta exitosamente.');
        // Cargar las notas existentes al abrir la app
        cargarNotas();
    };

    // 5. Configurar el botón de guardar
    const btnGuardar = document.getElementById('btn-guardar');
    const txtNota = document.getElementById('txt-nota');

    btnGuardar.addEventListener('click', () => {
        const texto = txtNota.value;
        if (texto.trim() === '') return; // No guardar notas vacías

        // Crear una "transacción" (de tipo lectura-escritura)
        const transaction = db.transaction(['notas'], 'readwrite');
        const store = transaction.objectStore('notas');

        // Añadir la nota
        const addRequest = store.add({ texto: texto, fecha: new Date() });

        addRequest.onsuccess = () => {
            console.log('Nota guardada!');
            txtNota.value = ''; // Limpiar el textarea
            cargarNotas(); // Recargar la lista de notas
        };

        addRequest.onerror = (event) => {
            console.error('Error al guardar la nota:', event);
        };
    });

    // 6. Función para cargar y mostrar todas las notas
    function cargarNotas() {
        const contenedor = document.getElementById('contenedor-notas');
        contenedor.innerHTML = ''; // Limpiar el contenedor

        const transaction = db.transaction(['notas'], 'readonly');
        const store = transaction.objectStore('notas');

        // Usar un "cursor" para leer todos los registros
        const cursorRequest = store.openCursor(null, 'prev'); // 'prev' para mostrar la más nueva primero

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const nota = cursor.value;

                // Crear el elemento HTML para la nota
                const divNota = document.createElement('div');
                divNota.textContent = `${nota.fecha.toLocaleString()}: ${nota.texto}`;
                contenedor.appendChild(divNota);

                // Mover al siguiente registro
                cursor.continue();
            }
        };
    }
});