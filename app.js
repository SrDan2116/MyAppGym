document.addEventListener('DOMContentLoaded', () => {

    let db;
    let fechaSeleccionadaGlobal = null;
    
    // Variables Globales para el creador de rutinas
    let rutinaTemporal = { nombre: '', dias: [] };
    let ejerciciosTemporalesParaDia = [];
    
    // NUEVO: Guardará el ID de la rutina que estamos editando
    let idRutinaEditando = null; 

    // --- Selectores del DOM (Sin cambios) ---
    // (Omitidos por brevedad, son los mismos que antes)
    const btnNavCalendario = document.getElementById('btn-nav-calendario');
    const btnNavRutinas = document.getElementById('btn-nav-rutinas');
    const seccionCalendario = document.getElementById('seccion-calendario');
    const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');
    const seccionRegistroDiario = document.getElementById('seccion-registro-diario');
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
    const calendarioGrid = document.getElementById('calendario-grid');
    const tituloRegistroDia = document.getElementById('titulo-registro-dia');
    const btnVolverCalendario = document.getElementById('btn-volver-calendario');
    const selectRutinaDelDia = document.getElementById('select-rutina-del-dia');
    const ejerciciosDelDia = document.getElementById('ejercicios-del-dia');
    const txtComentarioDia = document.getElementById('txt-comentario-dia');
    const btnGuardarRegistro = document.getElementById('btn-guardar-registro');


    // --- Inicialización de la BD (Sin cambios) ---
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


    // --- MÓDULO 1: GESTOR DE RUTINAS (CAMBIOS IMPORTANTES) ---

    // (Funciones 1 y 2 sin cambios: btnAgregarEjercicioADia, btnGuardarDiaEnRutina)
    btnAgregarEjercicioADia.addEventListener('click', () => {
        const nombreEjercicio = txtNombreEjercicio.value;
        const series = parseInt(numSeries.value);
        if (nombreEjercicio.trim() === '' || isNaN(series) || series <= 0) {
            alert('Ingresa nombre y series válidos.'); return;
        }
        ejerciciosTemporalesParaDia.push({ nombre: nombreEjercicio, series: series });
        renderizarEjerciciosTemporalesParaDia();
        txtNombreEjercicio.value = ''; numSeries.value = ''; txtNombreEjercicio.focus();
    });

    btnGuardarDiaEnRutina.addEventListener('click', () => {
        const nombreDia = txtNombreDia.value;
        if (nombreDia.trim() === '' || ejerciciosTemporalesParaDia.length === 0) {
            alert('Ingresa un nombre para el día y añade al menos un ejercicio.'); return;
        }
        rutinaTemporal.dias.push({ nombreDia: nombreDia, ejercicios: ejerciciosTemporalesParaDia });
        txtNombreRutina.disabled = true;
        rutinaTemporal.nombre = txtNombreRutina.value || 'Rutina Sin Nombre';
        renderizarDiasTemporalesUI();
        txtNombreDia.value = '';
        ejerciciosTemporalesParaDia = [];
        renderizarEjerciciosTemporalesParaDia();
    });

    // 3. Botón "Guardar Rutina Completa" (¡MODIFICADO!)
    btnGuardarRutinaCompleta.addEventListener('click', () => {
        rutinaTemporal.nombre = txtNombreRutina.value;
        if (rutinaTemporal.nombre.trim() === '' || rutinaTemporal.dias.length === 0) {
            alert('Ingresa un nombre de rutina y guarda al menos un día.');
            return;
        }

        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        let request;

        // ¡AQUÍ ESTÁ LA LÓGICA DE EDICIÓN!
        if (idRutinaEditando !== null) {
            // Estamos EDITANDO (usamos 'put')
            rutinaTemporal.id = idRutinaEditando; // Aseguramos que el ID esté en el objeto
            request = store.put(rutinaTemporal);
        } else {
            // Estamos CREANDO (usamos 'add')
            request = store.add(rutinaTemporal);
        }

        request.onsuccess = () => {
            alert('¡Rutina guardada!');
            limpiarFormularioRutina(); // Esto resetea idRutinaEditando a null
            cargarRutinasGuardadas(); // Recargar la lista
        };
        request.onerror = (event) => console.error('Error al guardar rutina:', event);
    });

    // 4. Botón "Cancelar"
    btnCancelarRutina.addEventListener('click', limpiarFormularioRutina);

    // 5. Función "Limpiar" (¡MODIFICADA!)
    function limpiarFormularioRutina() {
        rutinaTemporal = { nombre: '', dias: [] };
        ejerciciosTemporalesParaDia = [];
        
        // ¡MUY IMPORTANTE!
        idRutinaEditando = null; // Reseteamos el modo "edición"
        
        txtNombreRutina.value = '';
        txtNombreRutina.disabled = false;
        txtNombreDia.value = '';
        renderizarDiasTemporalesUI();
        renderizarEjerciciosTemporalesParaDia();
    }

    // 6. Funciones "renderizar" (Sin cambios)
    function renderizarEjerciciosTemporalesParaDia() {
        ejerciciosTemporalesParaDiaUI.innerHTML = '';
        ejerciciosTemporalesParaDia.forEach((ej, index) => {
            const div = document.createElement('div');
            div.className = 'ejercicio-temporal-item';
            div.innerHTML = `<span>${ej.nombre} (${ej.series} series)</span>
                             <button type="button" class="btn-borrar-item" data-index="${index}">&times;</button>`;
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

    // 7. Lógica para botones de borrar (X) (Sin cambios)
    seccionGestorRutinas.addEventListener('click', (event) => {
        if (event.target.matches('.btn-borrar-item')) {
            const index = parseInt(event.target.dataset.index);
            if (event.target.closest('#ejercicios-temporales-para-dia-ui')) {
                ejerciciosTemporalesParaDia.splice(index, 1);
                renderizarEjerciciosTemporalesParaDia();
            } else if (event.target.closest('#dias-temporales-ui')) {
                rutinaTemporal.dias.splice(index, 1);
                renderizarDiasTemporalesUI();
            }
        }
    });

    // 8. Cargar Rutinas Guardadas (¡MODIFICADA!)
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
                
                // AÑADIMOS EL BOTÓN "EDITAR"
                let contenido = `
                    <button class="btn-borrar-rutina" data-id="${rutina.id}">&times; Borrar</button>
                    <button class="btn-editar-rutina" data-id="${rutina.id}">Editar</button>
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

    // 9. Lógica para botones "Borrar" y "Editar" (¡MODIFICADA!)
    listaRutinas.addEventListener('click', (event) => {
        // Botón Borrar
        if (event.target.matches('.btn-borrar-rutina')) {
            const id = parseInt(event.target.dataset.id);
            if (confirm('¿Estás seguro de que quieres borrar esta rutina permanentemente?')) {
                borrarRutina(id);
            }
        }
        
        // ¡NUEVO! Botón Editar
        if (event.target.matches('.btn-editar-rutina')) {
            const id = parseInt(event.target.dataset.id);
            cargarRutinaParaEditar(id);
        }
    });

    function borrarRutina(id) {
        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => {
            console.log('Rutina borrada', id);
            cargarRutinasGuardadas();
        };
        deleteRequest.onerror = (event) => console.error('Error al borrar rutina', event);
    }

    // 10. ¡NUEVA FUNCIÓN! Cargar rutina para editar
    function cargarRutinaParaEditar(id) {
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
            const rutina = getRequest.result;
            if (!rutina) {
                console.error('No se encontró la rutina', id);
                return;
            }
            
            // Cargar los datos de la BD en las variables temporales
            txtNombreRutina.value = rutina.nombre;
            rutinaTemporal = rutina; // Carga la rutina completa (nombre, días, ejercicios)
            idRutinaEditando = rutina.id; // ¡Marcamos que estamos en modo "edición"!
            
            // Limpiar formulario de "Día" (por si acaso)
            ejerciciosTemporalesParaDia = [];
            renderizarEjerciciosTemporalesParaDia();
            txtNombreDia.value = '';

            // Dibujar los días de la rutina cargada
            renderizarDiasTemporalesUI();
            
            // Llevar al usuario al formulario
            txtNombreRutina.disabled = false;
            seccionGestorRutinas.querySelector('h3').scrollIntoView({ behavior: 'smooth' });
        };
        
        getRequest.onerror = (event) => console.error('Error al cargar rutina para editar', event);
    }

    
    // --- MÓDULOS 2 y 3 (CALENDARIO Y REGISTRO) ---
    // --- (Siguen pendientes de arreglar, sin cambios) ---

    function renderizarCalendario() {
        calendarioGrid.innerHTML = '';
        const hoy = new Date(); const mes = hoy.getMonth(); const ano = hoy.getFullYear();
        const diasEnMes = new Date(ano, mes + 1, 0).getDate();
        const transaction = db.transaction(['registros'], 'readonly');
        const store = transaction.objectStore('registros');
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
            const registros = getAllRequest.result.map(r => r.fecha);
            for (let dia = 1; dia <= diasEnMes; dia++) {
                const divDia = document.createElement('div'); divDia.className = 'dia-calendario';
                divDia.textContent = dia;
                const fechaISO = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                if (registros.includes(fechaISO)) divDia.classList.add('registrado');
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
        ejerciciosDelDia.innerHTML = ''; txtComentarioDia.value = '';
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
                option.value = rutina.id; option.textContent = rutina.nombre;
                selectRutinaDelDia.appendChild(option);
                cursor.continue();
            }
        };
    }

    selectRutinaDelDia.addEventListener('change', (event) => {
        ejerciciosDelDia.innerHTML = '<p style="color:red;">(Lógica de registro pendiente de actualizar)</p>';
    });

    btnGuardarRegistro.addEventListener('click', () => {
        alert("La función de guardar registro será actualizada en el siguiente paso.");
    });
});