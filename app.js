
document.addEventListener('DOMContentLoaded', () => {

    let db; // Variable para la base de datos
    let ejerciciosTemporales = []; // Array para guardar ejercicios antes de guardar la rutina

    // --- Selectores del DOM (para no repetirlos) ---
    const txtNombreRutina = document.getElementById('txt-nombre-rutina');
    const listaEjerciciosParaRutina = document.getElementById('lista-ejercicios-para-rutina');
    const txtNombreEjercicio = document.getElementById('txt-nombre-ejercicio');
    const numSeries = document.getElementById('num-series');
    const btnAgregarEjercicio = document.getElementById('btn-agregar-ejercicio');
    const btnGuardarRutinaCompleta = document.getElementById('btn-guardar-rutina-completa');
    const listaRutinas = document.getElementById('lista-rutinas');

    // 1. Abrir (o crear) la base de datos
    const request = indexedDB.open('GymAppDB', 2); // Seguimos en la versión 2

    // 2. Manejar errores
    request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event);
    };

    // 3. Este evento se ejecuta si la versión cambia (o es la primera vez)
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        console.log('Actualizando la base de datos (onupgradeneeded)');

        if (!db.objectStoreNames.contains('rutinas')) {
            db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
            console.log('Almacén "rutinas" creado.');
        }


        if (!db.objectStoreNames.contains('registros')) {

            db.createObjectStore('registros', { keyPath: 'fecha' });
            console.log('Almacén "registros" creado.');
        }
    };

    // 4. Cuando la BD se abre correctamente
    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos GymAppDB abierta exitosamente.');
        
        // ¡NUEVO! Cargar las rutinas que ya existen al abrir la app
        cargarRutinasGuardadas();
    };

    // --- LÓGICA DE LA APLICACIÓN ---

    // 5. Botón "Agregar Ejercicio"
    btnAgregarEjercicio.addEventListener('click', () => {
        const nombreEjercicio = txtNombreEjercicio.value;
        const series = parseInt(numSeries.value);

        if (nombreEjercicio.trim() === '' || isNaN(series) || series <= 0) {
            alert('Por favor, ingresa un nombre de ejercicio y un número de series válido.');
            return;
        }

        // Añadir al array temporal
        ejerciciosTemporales.push({ nombre: nombreEjercicio, series: series });

        // Mostrar en la UI
        actualizarListaEjerciciosUI();

        // Limpiar campos
        txtNombreEjercicio.value = '';
        numSeries.value = '';
        txtNombreEjercicio.focus();
    });

    // 6. Botón "Guardar Rutina Completa"
    btnGuardarRutinaCompleta.addEventListener('click', () => {
        const nombreRutina = txtNombreRutina.value;

        if (nombreRutina.trim() === '') {
            alert('Por favor, dale un nombre a tu rutina.');
            return;
        }
        if (ejerciciosTemporales.length === 0) {
            alert('Por favor, añade al menos un ejercicio a la rutina.');
            return;
        }

        // Crear el objeto Rutina
        const nuevaRutina = {
            nombre: nombreRutina,
            ejercicios: ejerciciosTemporales
        };

        // Guardar en IndexedDB
        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        const addRequest = store.add(nuevaRutina);

        addRequest.onsuccess = () => {
            console.log('Rutina guardada exitosamente!');
            alert('¡Rutina guardada!');
            
            // Limpiar todo
            txtNombreRutina.value = '';
            ejerciciosTemporales = []; // Vaciar el array temporal
            actualizarListaEjerciciosUI(); // Limpiar la lista visual
            cargarRutinasGuardadas(); // Recargar la lista de rutinas guardadas
        };

        addRequest.onerror = (event) => {
            console.error('Error al guardar la rutina:', event);
            alert('Error al guardar la rutina.');
        };
    });

    // 7. Función para mostrar ejercicios temporales en la UI
    function actualizarListaEjerciciosUI() {
        listaEjerciciosParaRutina.innerHTML = ''; // Limpiar la lista
        if (ejerciciosTemporales.length === 0) {
            listaEjerciciosParaRutina.innerHTML = '<p>Aún no hay ejercicios.</p>';
        } else {
            ejerciciosTemporales.forEach((ejercicio, index) => {
                const div = document.createElement('div');
                div.className = 'ejercicio-temporal';
                div.textContent = `${ejercicio.nombre} - ${ejercicio.series} series`;
                listaEjerciciosParaRutina.appendChild(div);
            });
        }
    }

    // 8. Función para cargar y mostrar las rutinas guardadas
    function cargarRutinasGuardadas() {
        listaRutinas.innerHTML = '<h4>Rutinas Existentes:</h4>'; // Limpiar

        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value;
                const divRutina = document.createElement('div');
                divRutina.className = 'rutina-guardada';
                
                // Mostrar nombre de la rutina
                let contenido = `<strong>${rutina.nombre} (ID: ${rutina.id})</strong><ul>`;
                
                // Mostrar ejercicios de la rutina
                rutina.ejercicios.forEach(ej => {
                    contenido += `<li>${ej.nombre} (${ej.series} series)</li>`;
                });
                contenido += '</ul>';

                divRutina.innerHTML = contenido;
                listaRutinas.appendChild(divRutina);

                cursor.continue(); // Mover al siguiente
            }
        };

        cursorRequest.onerror = (event) => {
            console.error('Error al cargar las rutinas', event);
        };
    }
    
    // Llamada inicial para que la lista no esté vacía si no hay ejercicios
    actualizarListaEjerciciosUI();
});