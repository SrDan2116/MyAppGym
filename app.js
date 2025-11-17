document.addEventListener('DOMContentLoaded', () => {

    let db;
    let fechaSeleccionadaGlobal = null;
    let rutinaTemporal = { nombre: '', dias: [] };
    let ejerciciosTemporalesParaDia = [];
    let idRutinaEditando = null;
    let rutinaCompletaSeleccionada = null;
    let elapsedSeconds = 0;
    let timerInterval = null;

    // --- Selectores del DOM ---
    
    // Navegación
    const btnNavHome = document.getElementById('btn-nav-home');
    const btnNavCalendario = document.getElementById('btn-nav-calendario');
    const btnNavRutinas = document.getElementById('btn-nav-rutinas');
    const btnNavPeso = document.getElementById('btn-nav-peso');
    const seccionHome = document.getElementById('seccion-home');
    const seccionCalendario = document.getElementById('seccion-calendario');
    const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');
    const seccionPeso = document.getElementById('seccion-peso');
    const seccionRegistroDiario = document.getElementById('seccion-registro-diario');
    
    // Gestor de Rutinas (Módulo 1)
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
    
    // Calendario (Módulo 2)
    const calendarioGrid = document.getElementById('calendario-grid');

    // Registro Diario (Módulo 3)
    const tituloRegistroDia = document.getElementById('titulo-registro-dia');
    const btnVolverCalendario = document.getElementById('btn-volver-calendario');
    const timerDisplay = document.getElementById('timer-display');
    const btnTimerStart = document.getElementById('btn-timer-start');
    const btnTimerPause = document.getElementById('btn-timer-pause');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const selectRutinaDelDia = document.getElementById('select-rutina-del-dia');
    const contenedorSelectDia = document.getElementById('contenedor-select-dia');
    const selectDiaDeRutina = document.getElementById('select-dia-de-rutina');
    const ejerciciosDelDia = document.getElementById('ejercicios-del-dia');
    const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
    // Vistas Read-Only / Editable
    const vistaReadonlyRegistro = document.getElementById('vista-readonly-registro');
    const formularioEditableRegistro = document.getElementById('formulario-editable-registro');
    const readonlyContenido = document.getElementById('readonly-contenido');
    
    // Peso (Módulo 4)
    const inputPeso = document.getElementById('input-peso');
    const inputAltura = document.getElementById('input-altura');
    const inputCintura = document.getElementById('input-cintura');
    const btnGuardarMedidas = document.getElementById('btn-guardar-medidas');
    const listaMedidas = document.getElementById('lista-medidas');
    const detalleMedida = document.getElementById('detalle-medida');
    const detalleMedidaTitulo = document.getElementById('detalle-medida-titulo');
    const detalleMedidaContenido = document.getElementById('detalle-medida-contenido');
    const btnCerrarDetalleMedida = document.getElementById('btn-cerrar-detalle-medida');

    // --- Inicialización de la BD (¡NUEVA VERSIÓN!) ---
    // ¡Añadimos la tabla 'medidas'!
    const request = indexedDB.open('GymAppDB', 3); // Subimos de versión

    request.onerror = (event) => console.error('Error al abrir IndexedDB:', event);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        console.log('Actualizando la base de datos (onupgradeneeded)');
        if (!db.objectStoreNames.contains('rutinas')) {
            db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('registros')) {
            db.createObjectStore('registros', { keyPath: 'fecha' });
        }
        // ¡NUEVA TABLA!
        if (!db.objectStoreNames.contains('medidas')) {
            db.createObjectStore('medidas', { keyPath: 'fecha' });
            console.log('Almacén "medidas" creado.');
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos GymAppDB abierta.');
        
        // Cargar datos en las secciones
        cargarRutinasGuardadas();
        renderizarCalendario();
        cargarListaMedidas();
        
        // Vista por defecto
        mostrarSeccion('seccion-home');
    };

    // --- NAVEGACIÓN PRINCIPAL (¡Modificada!) ---
    
    function mostrarSeccion(idSeccion) {
        // Ocultar todas
        seccionHome.classList.add('oculto');
        seccionCalendario.classList.add('oculto');
        seccionGestorRutinas.classList.add('oculto');
        seccionRegistroDiario.classList.add('oculto');
        seccionPeso.classList.add('oculto');
        
        // Mostrar la seleccionada
        const seccion = document.getElementById(idSeccion);
        if (seccion) seccion.classList.remove('oculto');
    }

    btnNavHome.addEventListener('click', () => mostrarSeccion('seccion-home'));
    btnNavCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));
    btnNavRutinas.addEventListener('click', () => mostrarSeccion('seccion-gestor-rutinas'));
    btnNavPeso.addEventListener('click', () => mostrarSeccion('seccion-peso'));
    
    btnVolverCalendario.addEventListener('click', () => {
        renderizarCalendario();
        mostrarSeccion('seccion-calendario');
    });

    // --- MÓDULO 1: GESTOR DE RUTINAS (Lógica de acordeón, sin cambios) ---
    // (Omitido por brevedad - es el mismo código de la respuesta anterior)
    btnAgregarEjercicioADia.addEventListener('click', () => {
        const nombreEjercicio = txtNombreEjercicio.value; const series = parseInt(numSeries.value);
        if (nombreEjercicio.trim() === '' || isNaN(series) || series <= 0) { alert('Ingresa nombre y series válidos.'); return; }
        ejerciciosTemporalesParaDia.push({ nombre: nombreEjercicio, series: series });
        renderizarEjerciciosTemporalesParaDia();
        txtNombreEjercicio.value = ''; numSeries.value = ''; txtNombreEjercicio.focus();
    });
    btnGuardarDiaEnRutina.addEventListener('click', () => {
        const nombreDia = txtNombreDia.value;
        if (nombreDia.trim() === '' || ejerciciosTemporalesParaDia.length === 0) { alert('Ingresa un nombre para el día y añade al menos un ejercicio.'); return; }
        rutinaTemporal.dias.push({ nombreDia: nombreDia, ejercicios: ejerciciosTemporalesParaDia });
        txtNombreRutina.disabled = true; rutinaTemporal.nombre = txtNombreRutina.value || 'Rutina Sin Nombre';
        renderizarDiasTemporalesUI();
        txtNombreDia.value = ''; ejerciciosTemporalesParaDia = []; renderizarEjerciciosTemporalesParaDia();
    });
    btnGuardarRutinaCompleta.addEventListener('click', () => {
        rutinaTemporal.nombre = txtNombreRutina.value;
        if (rutinaTemporal.nombre.trim() === '' || rutinaTemporal.dias.length === 0) { alert('Ingresa un nombre de rutina y guarda al menos un día.'); return; }
        const transaction = db.transaction(['rutinas'], 'readwrite'); const store = transaction.objectStore('rutinas');
        let request;
        if (idRutinaEditando !== null) {
            rutinaTemporal.id = idRutinaEditando; request = store.put(rutinaTemporal);
        } else {
            request = store.add(rutinaTemporal);
        }
        request.onsuccess = () => {
            alert('¡Rutina guardada!'); limpiarFormularioRutina(); cargarRutinasGuardadas();
        };
        request.onerror = (event) => console.error('Error al guardar rutina:', event);
    });
    btnCancelarRutina.addEventListener('click', limpiarFormularioRutina);
    function limpiarFormularioRutina() {
        rutinaTemporal = { nombre: '', dias: [] }; ejerciciosTemporalesParaDia = [];
        idRutinaEditando = null;
        txtNombreRutina.value = ''; txtNombreRutina.disabled = false; txtNombreDia.value = '';
        renderizarDiasTemporalesUI(); renderizarEjerciciosTemporalesParaDia();
    }
    function renderizarEjerciciosTemporalesParaDia() {
        ejerciciosTemporalesParaDiaUI.innerHTML = '';
        ejerciciosTemporalesParaDia.forEach((ej, index) => {
            const div = document.createElement('div'); div.className = 'ejercicio-temporal-item';
            div.innerHTML = `<span>${ej.nombre} (${ej.series} series)</span> <button type="button" class="btn-borrar-item" data-index="${index}">&times;</button>`;
            ejerciciosTemporalesParaDiaUI.appendChild(div);
        });
    }
    function renderizarDiasTemporalesUI() {
        diasTemporalesUI.innerHTML = '';
        rutinaTemporal.dias.forEach((dia, index) => {
            const div = document.createElement('div'); div.className = 'dia-temporal-item';
            div.innerHTML = `<span><strong>${dia.nombreDia}</strong> (${dia.ejercicios.length} ejercicios)</span> <button type="button" class="btn-borrar-item" data-index="${index}">&times;</button>`;
            diasTemporalesUI.appendChild(div);
        });
    }
    seccionGestorRutinas.addEventListener('click', (event) => {
        if (event.target.matches('.btn-borrar-item')) {
            const index = parseInt(event.target.dataset.index);
            if (event.target.closest('#ejercicios-temporales-para-dia-ui')) {
                ejerciciosTemporalesParaDia.splice(index, 1); renderizarEjerciciosTemporalesParaDia();
            } else if (event.target.closest('#dias-temporales-ui')) {
                rutinaTemporal.dias.splice(index, 1); renderizarDiasTemporalesUI();
            }
        }
    });
    function cargarRutinasGuardadas() {
        listaRutinas.innerHTML = '<h4>Rutinas Existentes:</h4>';
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value; const divRutina = document.createElement('div'); divRutina.className = 'rutina-guardada';
                const divHeader = document.createElement('div'); divHeader.className = 'rutina-header';
                divHeader.innerHTML = `<span class="rutina-nombre">${rutina.nombre} (${rutina.dias.length} días)</span><span class="rutina-acordeon-icono">&#x25BC;</span>`;
                const divControles = document.createElement('div'); divControles.className = 'rutina-controles';
                divControles.innerHTML = `<button class="btn-editar-rutina" data-id="${rutina.id}">Editar</button><button class="btn-borrar-rutina" data-id="${rutina.id}">&times; Borrar</button>`;
                const divBody = document.createElement('div'); divBody.className = 'rutina-detalles oculto';
                let contenidoDetalles = '';
                rutina.dias.forEach(dia => {
                    contenidoDetalles += `<p><strong>${dia.nombreDia}</strong></p><ul>`;
                    dia.ejercicios.forEach(ej => { contenidoDetalles += `<li>${ej.nombre} (${ej.series} series)</li>`; });
                    contenidoDetalles += '</ul>';
                });
                divBody.innerHTML = contenidoDetalles;
                divRutina.appendChild(divHeader); divRutina.appendChild(divControles); divRutina.appendChild(divBody);
                listaRutinas.appendChild(divRutina);
                cursor.continue();
            }
        };
    }
    listaRutinas.addEventListener('click', (event) => {
        if (event.target.matches('.btn-borrar-rutina')) {
            const id = parseInt(event.target.dataset.id);
            if (confirm('¿Estás seguro de que quieres borrar esta rutina permanentemente?')) { borrarRutina(id); }
        }
        if (event.target.matches('.btn-editar-rutina')) {
            const id = parseInt(event.target.dataset.id); cargarRutinaParaEditar(id);
        }
        if (event.target.closest('.rutina-header')) {
            const header = event.target.closest('.rutina-header');
            const body = header.parentElement.querySelector('.rutina-detalles');
            if (body) {
                body.classList.toggle('oculto');
                const icono = header.querySelector('.rutina-acordeon-icono');
                if (icono) { icono.innerHTML = body.classList.contains('oculto') ? '&#x25BC;' : '&#x25B2;'; }
            }
        }
    });
    function borrarRutina(id) {
        const transaction = db.transaction(['rutinas'], 'readwrite'); const store = transaction.objectStore('rutinas');
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => { console.log('Rutina borrada', id); cargarRutinasGuardadas(); };
        deleteRequest.onerror = (event) => console.error('Error al borrar rutina', event);
    }
    function cargarRutinaParaEditar(id) {
        const transaction = db.transaction(['rutinas'], 'readonly'); const store = transaction.objectStore('rutinas');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const rutina = getRequest.result; if (!rutina) { console.error('No se encontró la rutina', id); return; }
            txtNombreRutina.value = rutina.nombre; rutinaTemporal = rutina; idRutinaEditando = rutina.id;
            ejerciciosTemporalesParaDia = []; renderizarEjerciciosTemporalesParaDia(); txtNombreDia.value = '';
            renderizarDiasTemporalesUI();
            txtNombreRutina.disabled = false; seccionGestorRutinas.querySelector('h3').scrollIntoView({ behavior: 'smooth' });
        };
        getRequest.onerror = (event) => console.error('Error al cargar rutina para editar', event);
    }

    
    // --- MÓDULOS 2 y 3 (CALENDARIO Y REGISTRO) ---
    // --- (¡Lógica de SOLO LECTURA implementada!) ---

    // (renderizarCalendario sin cambios)
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
    
    // ¡MODIFICADO!
    function abrirRegistroParaDia(fecha) {
        tituloRegistroDia.textContent = `Registro del ${fecha}`;
        
        const transaction = db.transaction(['registros'], 'readonly');
        const store = transaction.objectStore('registros');
        const getRequest = store.get(fecha);

        getRequest.onsuccess = () => {
            const registro = getRequest.result;
            if (registro) {
                // ¡LÓGICA DE SOLO LECTURA!
                // Si existe un registro, mostramos la vista de solo lectura
                renderizarRegistroReadOnly(registro);
                vistaReadonlyRegistro.classList.remove('oculto');
                formularioEditableRegistro.classList.add('oculto');
            } else {
                // LÓGICA DE CREACIÓN
                // Si no hay registro, mostramos el formulario editable
                vistaReadonlyRegistro.classList.add('oculto');
                formularioEditableRegistro.classList.remove('oculto');
                
                // Reseteamos el formulario
                resetTimer(); 
                rutinaCompletaSeleccionada = null;
                ejerciciosDelDia.innerHTML = '';
                contenedorSelectDia.classList.add('oculto');
                cargarRutinasEnSelect();
                selectRutinaDelDia.value = "";
                selectDiaDeRutina.innerHTML = '<option value="">-- Selecciona un día --</option>';
            }
            // Mostramos la sección general de registro
            mostrarSeccion('seccion-registro-diario');
        };
    }

    // ¡NUEVA FUNCIÓN! Para mostrar los datos guardados
    function renderizarRegistroReadOnly(registro) {
        let html = `
            <p><strong>Rutina:</strong> ${registro.rutinaNombre}</p>
            <p><strong>Día:</strong> ${registro.diaNombre}</p>
            <p><strong>Tiempo Total:</strong> ${formatTime(registro.tiempoTotal)}</p>
            <h4>Ejercicios Registrados:</h4>
        `;
        
        registro.ejercicios.forEach(ej => {
            html += `<p><strong>${ej.nombre}</strong></p><ul>`;
            ej.reps.forEach((rep, i) => {
                html += `<li>Serie ${i + 1}: <span>${rep} reps</span></li>`;
            });
            html += '</ul>';
        });
        
        readonlyContenido.innerHTML = html;
    }

    // (cargarRutinasEnSelect, cargarDiasDeRutina, selectRutinaDelDia, selectDiaDeRutina, mostrarEjerciciosParaRegistrar...
    // ...no cambian, se usarán solo al crear un nuevo registro)
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
        const rutinaId = parseInt(event.target.value);
        if (isNaN(rutinaId) || !rutinaId) {
            rutinaCompletaSeleccionada = null;
            contenedorSelectDia.classList.add('oculto');
            ejerciciosDelDia.innerHTML = '';
            return;
        }
        cargarDiasDeRutina(rutinaId);
    });
    function cargarDiasDeRutina(rutinaId, callback) {
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        const getRequest = store.get(rutinaId);
        getRequest.onsuccess = () => {
            rutinaCompletaSeleccionada = getRequest.result;
            if (rutinaCompletaSeleccionada) {
                selectDiaDeRutina.innerHTML = '<option value="">-- Selecciona un día --</option>';
                rutinaCompletaSeleccionada.dias.forEach((dia, index) => {
                    const option = document.createElement('option');
                    option.value = index; option.textContent = dia.nombreDia;
                    selectDiaDeRutina.appendChild(option);
                });
                contenedorSelectDia.classList.remove('oculto');
                if (callback) callback();
            }
        };
    }
    selectDiaDeRutina.addEventListener('change', (event) => {
        const diaIndex = parseInt(event.target.value);
        if (isNaN(diaIndex) || !rutinaCompletaSeleccionada) {
            ejerciciosDelDia.innerHTML = ''; return;
        }
        const diaSeleccionado = rutinaCompletaSeleccionada.dias[diaIndex];
        mostrarEjerciciosParaRegistrar(diaSeleccionado.ejercicios);
    });
    function mostrarEjerciciosParaRegistrar(ejercicios, datosGuardados = []) {
        ejerciciosDelDia.innerHTML = '';
        ejercicios.forEach((ej, index) => {
            const divEj = document.createElement('div');
            divEj.className = 'ejercicio-para-registrar';
            divEj.innerHTML = `<strong>${ej.nombre} (${ej.series} series)</strong>`;
            const datosEj = datosGuardados.find(d => d.nombre === ej.nombre);
            for (let i = 1; i <= ej.series; i++) {
                const label = document.createElement('label'); label.textContent = ` Serie ${i}: `;
                const input = document.createElement('input');
                input.type = 'number'; input.placeholder = 'Reps'; input.className = 'rep-input';
                input.dataset.ejercicioIndex = index; input.dataset.serieIndex = i - 1;
                if (datosEj && datosEj.reps[i - 1] !== undefined) {
                    input.value = datosEj.reps[i - 1];
                }
                divEj.appendChild(label); divEj.appendChild(input);
            }
            ejerciciosDelDia.appendChild(divEj);
        });
    }

    // ¡MODIFICADO! Sin campo de comentarios
    btnGuardarRegistro.addEventListener('click', () => {
        if (!fechaSeleccionadaGlobal || !rutinaCompletaSeleccionada) {
            alert('Error: no hay fecha o rutina seleccionada.'); return;
        }
        const diaIndex = parseInt(selectDiaDeRutina.value);
        if (isNaN(diaIndex)) {
            alert('Por favor, selecciona un día de la rutina.'); return;
        }
        pauseTimer(); 
        const inputsReps = document.querySelectorAll('.rep-input');
        const ejerciciosRegistrados = {};
        inputsReps.forEach(input => {
            const ejIndex = input.dataset.ejercicioIndex;
            const repValue = input.value ? parseInt(input.value) : 0;
            if (!ejerciciosRegistrados[ejIndex]) {
                const nombre = rutinaCompletaSeleccionada.dias[diaIndex].ejercicios[ejIndex].nombre;
                ejerciciosRegistrados[ejIndex] = { nombre: nombre, reps: [] };
            }
            ejerciciosRegistrados[ejIndex].reps.push(repValue);
        });
        const registroFinalEjercicios = Object.values(ejerciciosRegistrados);
        
        const registroDelDia = {
            fecha: fechaSeleccionadaGlobal,
            rutinaId: rutinaCompletaSeleccionada.id,
            rutinaNombre: rutinaCompletaSeleccionada.nombre,
            diaIndex: diaIndex,
            diaNombre: rutinaCompletaSeleccionada.dias[diaIndex].nombreDia,
            ejercicios: registroFinalEjercicios,
            tiempoTotal: elapsedSeconds
            // ¡COMENTARIO ELIMINADO!
        };

        const transaction = db.transaction(['registros'], 'readwrite');
        const store = transaction.objectStore('registros');
        const putRequest = store.put(registroDelDia); 

        putRequest.onsuccess = () => {
            alert('¡Entrenamiento guardado para el día ' + fechaSeleccionadaGlobal + '!');
            renderizarCalendario();
            mostrarSeccion('seccion-calendario');
        };
        putRequest.onerror = (event) => console.error('Error al guardar el registro:', event);
    });

    // --- CRONÓMETRO (Sin cambios) ---
    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);
    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            timerDisplay.textContent = formatTime(elapsedSeconds);
        }, 1000);
    }
    function pauseTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    function resetTimer() {
        pauseTimer();
        elapsedSeconds = 0;
        timerDisplay.textContent = "00:00:00";
    }
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // --- ¡NUEVO! LÓGICA DEL MÓDULO DE PESO ---
    
    // Guardar Medidas
    btnGuardarMedidas.addEventListener('click', () => {
        const hoy = new Date();
        const fechaISO = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
        
        const peso = parseFloat(inputPeso.value);
        const altura = parseFloat(inputAltura.value);
        const cintura = parseFloat(inputCintura.value);

        if (isNaN(peso) && isNaN(altura) && isNaN(cintura)) {
            alert('Debes ingresar al menos un valor.');
            return;
        }

        const medidasData = {
            fecha: fechaISO,
            peso: isNaN(peso) ? null : peso,
            altura: isNaN(altura) ? null : altura,
            cintura: isNaN(cintura) ? null : cintura
        };
        
        // Usamos 'put' para que si guardas 2 veces en un día, se sobreescriba
        const transaction = db.transaction(['medidas'], 'readwrite');
        const store = transaction.objectStore('medidas');
        const putRequest = store.put(medidasData);

        putRequest.onsuccess = () => {
            alert('¡Medidas guardadas para hoy!');
            inputPeso.value = '';
            inputAltura.value = '';
            inputCintura.value = '';
            cargarListaMedidas(); // Recargar la lista
        };
        putRequest.onerror = (event) => console.error('Error al guardar medidas:', event);
    });
    
    // Cargar la lista de fechas
    function cargarListaMedidas() {
        listaMedidas.innerHTML = '';
        const transaction = db.transaction(['medidas'], 'readonly');
        const store = transaction.objectStore('medidas');
        // 'prev' para mostrar el más reciente primero
        store.openCursor(null, 'prev').onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const fecha = cursor.value.fecha;
                const div = document.createElement('div');
                div.className = 'registro-fecha';
                div.textContent = `Registro del ${fecha}`;
                div.dataset.fecha = fecha; // Guardamos la fecha para el click
                listaMedidas.appendChild(div);
                cursor.continue();
            }
        };
    }
    
    // Mostrar el detalle (Modal)
    listaMedidas.addEventListener('click', (event) => {
        if (event.target.matches('.registro-fecha')) {
            const fecha = event.target.dataset.fecha;
            mostrarDetalleMedida(fecha);
        }
    });
    
    function mostrarDetalleMedida(fecha) {
        const transaction = db.transaction(['medidas'], 'readonly');
        const store = transaction.objectStore('medidas');
        const getRequest = store.get(fecha);
        
        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (data) {
                detalleMedidaTitulo.textContent = `Detalles del ${data.fecha}`;
                detalleMedidaContenido.innerHTML = `
                    <p><strong>Peso:</strong> ${data.peso || 'N/A'} kg</p>
                    <p><strong>Altura:</strong> ${data.altura || 'N/A'} cm</p>
                    <p><strong>Cintura:</strong> ${data.cintura || 'N/A'} cm</p>
                `;
                detalleMedida.classList.remove('oculto');
            }
        };
    }
    
    // Cerrar el detalle (Modal)
    btnCerrarDetalleMedida.addEventListener('click', () => {
        detalleMedida.classList.add('oculto');
    });
});