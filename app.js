document.addEventListener('DOMContentLoaded', () => {

    let db;
    let fechaSeleccionadaGlobal = null;
    
    // --- NUEVAS Variables Globales para el creador de rutinas ---
    // Guardará la rutina que estamos creando { nombre: 'PPL', dias: [ {nombreDia: 'Push', ejercicios: [...] } ] }
    let rutinaTemporal = { nombre: '', dias: [] };
    // Guardará los ejercicios para el DÍA que estamos creando [{ nombre: 'Press', series: 3 }]
    let ejerciciosTemporalesParaDia = [];

    // --- Selectores del DOM ---
    
    // Navegación
    const btnNavCalendario = document.getElementById('btn-nav-calendario');
    const btnNavRutinas = document.getElementById('btn-nav-rutinas');
    const seccionCalendario = document.getElementById('seccion-calendario');
    const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');
    const seccionRegistroDiario = document.getElementById('seccion-registro-diario');
    
    // Gestor de Rutinas (NUEVOS selectores)
    const listaRutinas = document.getElementById('lista-rutinas');
    const txtNombreRutina = document.getElementById('txt-nombre-rutina');
    const diasTemporalesUI = document.getElementById('dias-temporales-ui');
    const txtNombreDia = document.getElementById('txt-nombre-dia');
    const ejerciciosTemporalesParaDiaUI = document.getElementById('ejercicios-temporales-para-dia-ui');
    const txtNombreEjercicio = document.getElementById('txt-nombre-ejercicio');
    const numSeries = document.getElementById('num-series');
    const btnAgregarEjercicioADia = document.getElementById('btn-agregar-ejercicio-a-dia');
    const btnGuardarDiaEnRutina = document.getElementById('btn-guardar-dia-en-rutina');
    const btnGuardarRutinaCompleta = document.getElementById('btn-guardar-rutina-completa');
    const btnCancelarRutina = document.getElementById('btn-cancelar-rutina');
    
    // Calendario
    const calendarioGrid = document.getElementById('calendario-grid');

    // Registro Diario
    const tituloRegistroDia = document.getElementById('titulo-registro-dia');
    const btnVolverCalendario = document.getElementById('btn-volver-calendario');
    const selectRutinaDelDia = document.getElementById('select-rutina-del-dia');
    const ejerciciosDelDia = document.getElementById('ejercicios-del-dia');
    const txtComentarioDia = document.getElementById('txt-comentario-dia');
    const btnGuardarRegistro = document.getElementById('btn-guardar-registro');


    // --- Inicialización de la BD (Sin cambios) ---
    // No necesitamos cambiar la versión de la BD, solo la *forma* de los datos
    const request = indexedDB.open('GymAppDB', 2); 

    request.onerror = (event) => console.error('Error al abrir IndexedDB:', event);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('rutinas')) {
            db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('registros')) {
            db.createObjectStore('registros', { keyPath: 'fecha' });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos GymAppDB abierta.');
        cargarRutinasGuardadas();
        renderizarCalendario();
        mostrarSeccion('seccion-calendario');
    };

    // --- NAVEGACIÓN PRINCIPAL (Sin cambios) ---
    
    function mostrarSeccion(idSeccion) {
        seccionCalendario.classList.add('oculto');
        seccionGestorRutinas.classList.add('oculto');
        seccionRegistroDiario.classList.add('oculto');
        const seccion = document.getElementById(idSeccion);
        if (seccion) seccion.classList.remove('oculto');
    }

    btnNavCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));
    btnNavRutinas.addEventListener('click', () => mostrarSeccion('seccion-gestor-rutinas'));
    btnVolverCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));


    // --- MÓDULO 1: GESTOR DE RUTINAS (Lógica 100% nueva) ---

    // 1. Botón "Añadir Ejercicio al Día"
    btnAgregarEjercicioADia.addEventListener('click', () => {
        const nombreEjercicio = txtNombreEjercicio.value;
        const series = parseInt(numSeries.value);
        if (nombreEjercicio.trim() === '' || isNaN(series) || series <= 0) {
            alert('Ingresa nombre y series válidos.');
            return;
        }
        // Añadir al array temporal del DÍA
        ejerciciosTemporalesParaDia.push({ nombre: nombreEjercicio, series: series });
        
        // Actualizar UI
        renderizarEjerciciosTemporalesParaDia();
        
        // Limpiar campos
        txtNombreEjercicio.value = '';
        numSeries.value = '';
        txtNombreEjercicio.focus();
    });

    // 2. Botón "Guardar este Día"
    btnGuardarDiaEnRutina.addEventListener('click', () => {
        const nombreDia = txtNombreDia.value;
        if (nombreDia.trim() === '' || ejerciciosTemporalesParaDia.length === 0) {
            alert('Ingresa un nombre para el día y añade al menos un ejercicio.');
            return;
        }
        
        // Añadir el día a la RUTINA temporal
        rutinaTemporal.dias.push({
            nombreDia: nombreDia,
            ejercicios: ejerciciosTemporalesParaDia
        });
        
        // Actualizar UI
        txtNombreRutina.disabled = true; // Bloquear nombre de la rutina
        rutinaTemporal.nombre = txtNombreRutina.value || 'Rutina Sin Nombre';
        renderizarDiasTemporalesUI();

        // Limpiar formulario del día
        txtNombreDia.value = '';
        ejerciciosTemporalesParaDia = [];
        renderizarEjerciciosTemporalesParaDia();
    });

    // 3. Botón "Guardar Rutina Completa en la BD"
    btnGuardarRutinaCompleta.addEventListener('click', () => {
        rutinaTemporal.nombre = txtNombreRutina.value;
        if (rutinaTemporal.nombre.trim() === '' || rutinaTemporal.dias.length === 0) {
            alert('Ingresa un nombre de rutina y guarda al menos un día.');
            return;
        }

        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        const addRequest = store.add(rutinaTemporal);

        addRequest.onsuccess = () => {
            alert('¡Rutina guardada!');
            limpiarFormularioRutina();
            cargarRutinasGuardadas(); // Recargar la lista
        };
        addRequest.onerror = (event) => console.error('Error al guardar rutina:', event);
    });

    // 4. Botón "Cancelar"
    btnCancelarRutina.addEventListener('click', limpiarFormularioRutina);

    // 5. Función para limpiar todo el formulario de creación
    function limpiarFormularioRutina() {
        rutinaTemporal = { nombre: '', dias: [] };
        ejerciciosTemporalesParaDia = [];
        txtNombreRutina.value = '';
        txtNombreRutina.disabled = false;
        txtNombreDia.value = '';
        renderizarDiasTemporalesUI();
        renderizarEjerciciosTemporalesParaDia();
    }

    // 6. Funciones para renderizar (dibujar) las listas temporales
    function renderizarEjerciciosTemporalesParaDia() {
        ejerciciosTemporalesParaDiaUI.innerHTML = '';
        ejerciciosTemporalesParaDia.forEach((ej, index) => {
            const div = document.createElement('div');
            div.className = 'ejercicio-temporal-item';
            div.innerHTML = `<span>${ej.nombre} (${ej.series} series)</span>
                             <button type_button" class="btn-borrar-item" data-index="${index}">&times;</button>`;
            ejerciciosTemporalesParaDiaUI.appendChild(div);
        });
    }

    function renderizarDiasTemporalesUI() {
        diasTemporalesUI.innerHTML = '';
        rutinaTemporal.dias.forEach((dia, index) => {
            const div = document.createElement('div');
            div.className = 'dia-temporal-item';
            div.innerHTML = `<span><strong>${dia.nombreDia}</strong> (${dia.ejercicios.length} ejercicios)</span>
                             <button type="button" class="btn-borrar-item" data-index="${index}">&times;</button>`;
            diasTemporalesUI.appendChild(div);
        });
    }

    // 7. Lógica para los botones de borrar (X) de las listas temporales
    // Usamos delegación de eventos
    seccionGestorRutinas.addEventListener('click', (event) => {
        if (event.target.matches('.btn-borrar-item')) {
            const index = parseInt(event.target.dataset.index);
            
            // Borrar de la lista de ejercicios del día
            if (event.target.closest('#ejercicios-temporales-para-dia-ui')) {
                ejerciciosTemporalesParaDia.splice(index, 1);
                renderizarEjerciciosTemporalesParaDia();
            }
            // Borrar de la lista de días de la rutina
            else if (event.target.closest('#dias-temporales-ui')) {
                rutinaTemporal.dias.splice(index, 1);
                renderizarDiasTemporalesUI();
            }
        }
    });

    // 8. Cargar y mostrar las rutinas guardadas (con lógica de borrado)
    function cargarRutinasGuardadas() {
        listaRutinas.innerHTML = '<h4>Rutinas Existentes:</h4>';
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value;
                const divRutina = document.createElement('div');
                divRutina.className = 'rutina-guardada';
                
                let contenido = `<button class="btn-borrar-rutina" data-id="${rutina.id}">&times; Borrar</button>
                                 <strong>${rutina.nombre}</strong> (${rutina.dias.length} días)`;
                
                rutina.dias.forEach(dia => {
                    contenido += `<p><strong>${dia.nombreDia}</strong></p><ul>`;
                    dia.ejercicios.forEach(ej => {
                        contenido += `<li>${ej.nombre} (${ej.series} series)</li>`;
                    });
                    contenido += '</ul>';
                });

                divRutina.innerHTML = contenido;
                listaRutinas.appendChild(divRutina);
                cursor.continue();
            }
        };
    }

    // 9. Lógica para el botón "Borrar" (el grande) de una rutina guardada
    listaRutinas.addEventListener('click', (event) => {
        if (event.target.matches('.btn-borrar-rutina')) {
            const id = parseInt(event.target.dataset.id);
            if (confirm('¿Estás seguro de que quieres borrar esta rutina permanentemente?')) {
                borrarRutina(id);
            }
        }
    });

    function borrarRutina(id) {
        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => {
            console.log('Rutina borrada', id);
            cargarRutinasGuardadas(); // Recargar la lista
        };
        deleteRequest.onerror = (event) => console.error('Error al borrar rutina', event);
    }


    // --- MÓDULOS 2 y 3 (CALENDARIO Y REGISTRO) ---
    // --- (Sin cambios por ahora, los modificaremos en la Parte 2) ---

    function renderizarCalendario() {
        calendarioGrid.innerHTML = '';
        const hoy = new Date();
        const mes = hoy.getMonth();
        const ano = hoy.getFullYear();
        const diasEnMes = new Date(ano, mes + 1, 0).getDate();
        
        const transaction = db.transaction(['registros'], 'readonly');
        const store = transaction.objectStore('registros');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const registros = getAllRequest.result.map(r => r.fecha);
            for (let dia = 1; dia <= diasEnMes; dia++) {
                const divDia = document.createElement('div');
                divDia.className = 'dia-calendario';
                divDia.textContent = dia;
                const fechaISO = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                if (registros.includes(fechaISO)) {
                    divDia.classList.add('registrado');
                }
                divDia.addEventListener('click', () => {
                    fechaSeleccionadaGlobal = fechaISO;
                    abrirRegistroParaDia(fechaISO);
                });
                calendarioGrid.appendChild(divDia);
            }
        };
    }
    
    function abrirRegistroParaDia(fecha) {
        tituloRegistroDia.textContent = `Registrar para el ${fecha}`;
        ejerciciosDelDia.innerHTML = '';
        txtComentarioDia.value = '';
        cargarRutinasEnSelect();
        mostrarSeccion('seccion-registro-diario');
    }

    function cargarRutinasEnSelect() {
        selectRutinaDelDia.innerHTML = '<option value="">-- Selecciona una rutina --</option>';
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value;
                const option = document.createElement('option');
                option.value = rutina.id;
                option.textContent = rutina.nombre;
                selectRutinaDelDia.appendChild(option);
                cursor.continue();
            }
        };
    }

    selectRutinaDelDia.addEventListener('change', (event) => {
        // --- ESTA FUNCIÓN QUEDARÁ INCOMPLETA HASTA LA PARTE 2 ---
        ejerciciosDelDia.innerHTML = '<p style="color:red;">(Lógica de registro pendiente de actualizar)</p>';
        
        // La lógica antigua de mostrar ejercicios ya no funciona.
        // La dejaremos pendiente hasta el siguiente paso.
    });

    btnGuardarRegistro.addEventListener('click', () => {
        // --- ESTA FUNCIÓN TAMBIÉN QUEDARÁ INCOMPLETA ---
        alert("La función de guardar registro será actualizada en el siguiente paso para soportar los 'días' de la rutina.");
    });
});