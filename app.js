document.addEventListener('DOMContentLoaded', () => {

    let db;
    let ejerciciosTemporales = [];
    // NUEVO: Guardará la fecha seleccionada (ej: '2025-11-17')
    let fechaSeleccionadaGlobal = null; 

    // --- Selectores del DOM ---
    
    // Navegación
    const btnNavCalendario = document.getElementById('btn-nav-calendario');
    const btnNavRutinas = document.getElementById('btn-nav-rutinas');
    const seccionCalendario = document.getElementById('seccion-calendario');
    const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');
    const seccionRegistroDiario = document.getElementById('seccion-registro-diario');
    
    // Gestor de Rutinas
    const txtNombreRutina = document.getElementById('txt-nombre-rutina');
    const listaEjerciciosParaRutina = document.getElementById('lista-ejercicios-para-rutina');
    const txtNombreEjercicio = document.getElementById('txt-nombre-ejercicio');
    const numSeries = document.getElementById('num-series');
    const btnAgregarEjercicio = document.getElementById('btn-agregar-ejercicio');
    const btnGuardarRutinaCompleta = document.getElementById('btn-guardar-rutina-completa');
    const listaRutinas = document.getElementById('lista-rutinas');

    // Calendario
    const calendarioGrid = document.getElementById('calendario-grid');

    // Registro Diario
    const tituloRegistroDia = document.getElementById('titulo-registro-dia');
    const btnVolverCalendario = document.getElementById('btn-volver-calendario');
    const selectRutinaDelDia = document.getElementById('select-rutina-del-dia');
    const ejerciciosDelDia = document.getElementById('ejercicios-del-dia');
    const txtComentarioDia = document.getElementById('txt-comentario-dia');
    const btnGuardarRegistro = document.getElementById('btn-guardar-registro');


    // --- Inicialización de la BD ---
    const request = indexedDB.open('GymAppDB', 2);

    request.onerror = (event) => console.error('Error al abrir IndexedDB:', event);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('rutinas')) {
            db.createObjectStore('rutinas', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('registros')) {
            // Usaremos la fecha (ej. '2025-11-17') como la clave
            db.createObjectStore('registros', { keyPath: 'fecha' });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Base de datos GymAppDB abierta.');
        
        // Cargar vistas iniciales
        cargarRutinasGuardadas();
        renderizarCalendario();
        
        // Vista por defecto
        mostrarSeccion('seccion-calendario');
    };

    // --- NAVEGACIÓN PRINCIPAL ---
    
    function mostrarSeccion(idSeccion) {
        // Ocultar todas
        seccionCalendario.classList.add('oculto');
        seccionGestorRutinas.classList.add('oculto');
        seccionRegistroDiario.classList.add('oculto');
        
        // Mostrar la seleccionada
        const seccion = document.getElementById(idSeccion);
        if (seccion) {
            seccion.classList.remove('oculto');
        }
    }

    btnNavCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));
    btnNavRutinas.addEventListener('click', () => mostrarSeccion('seccion-gestor-rutinas'));
    btnVolverCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));


    // --- MÓDULO 1: GESTOR DE RUTINAS (Lógica que ya teníamos) ---

    btnAgregarEjercicio.addEventListener('click', () => {
        const nombreEjercicio = txtNombreEjercicio.value;
        const series = parseInt(numSeries.value);
        if (nombreEjercicio.trim() === '' || isNaN(series) || series <= 0) {
            alert('Ingresa nombre y series válidos.');
            return;
        }
        ejerciciosTemporales.push({ nombre: nombreEjercicio, series: series });
        actualizarListaEjerciciosUI();
        txtNombreEjercicio.value = '';
        numSeries.value = '';
        txtNombreEjercicio.focus();
    });

    btnGuardarRutinaCompleta.addEventListener('click', () => {
        const nombreRutina = txtNombreRutina.value;
        if (nombreRutina.trim() === '' || ejerciciosTemporales.length === 0) {
            alert('Ingresa un nombre y al menos un ejercicio.');
            return;
        }

        const nuevaRutina = { nombre: nombreRutina, ejercicios: ejerciciosTemporales };
        const transaction = db.transaction(['rutinas'], 'readwrite');
        const store = transaction.objectStore('rutinas');
        const addRequest = store.add(nuevaRutina);

        addRequest.onsuccess = () => {
            alert('¡Rutina guardada!');
            txtNombreRutina.value = '';
            ejerciciosTemporales = [];
            actualizarListaEjerciciosUI();
            cargarRutinasGuardadas();
        };
        addRequest.onerror = (event) => console.error('Error al guardar rutina:', event);
    });

    function actualizarListaEjerciciosUI() {
        listaEjerciciosParaRutina.innerHTML = '';
        if (ejerciciosTemporales.length === 0) {
            listaEjerciciosParaRutina.innerHTML = '<p>Aún no hay ejercicios.</p>';
        } else {
            ejerciciosTemporales.forEach((ejercicio) => {
                const div = document.createElement('div');
                div.textContent = `${ejercicio.nombre} - ${ejercicio.series} series`;
                listaEjerciciosParaRutina.appendChild(div);
            });
        }
    }

    function cargarRutinasGuardadas() {
        listaRutinas.innerHTML = '<h4>Rutinas Existentes:</h4>';
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value;
                const divRutina = document.createElement('div');
                divRutina.className = 'rutina-guardada';
                let contenido = `<strong>${rutina.nombre}</strong><ul>`;
                rutina.ejercicios.forEach(ej => {
                    contenido += `<li>${ej.nombre} (${ej.series} series)</li>`;
                });
                contenido += '</ul>';
                divRutina.innerHTML = contenido;
                listaRutinas.appendChild(divRutina);
                cursor.continue();
            }
        };
    }
    
    actualizarListaEjerciciosUI(); // Llamada inicial


    // --- MÓDULO 2: CALENDARIO (Nueva Lógica) ---

    function renderizarCalendario() {
        calendarioGrid.innerHTML = ''; // Limpiar calendario
        const hoy = new Date();
        const mes = hoy.getMonth(); // 0 = Enero, 11 = Diciembre
        const ano = hoy.getFullYear();

        // Días en el mes
        const diasEnMes = new Date(ano, mes + 1, 0).getDate();
        
        // Transacción para ver qué días ya están registrados
        const transaction = db.transaction(['registros'], 'readonly');
        const store = transaction.objectStore('registros');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const registros = getAllRequest.result.map(r => r.fecha); // Array de fechas ej: ['2025-11-17', ...]

            for (let dia = 1; dia <= diasEnMes; dia++) {
                const divDia = document.createElement('div');
                divDia.className = 'dia-calendario';
                divDia.textContent = dia;

                // Formato 'YYYY-MM-DD'
                const fechaISO = `${ano}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
                
                // Marcar si el día ya tiene registro
                if (registros.includes(fechaISO)) {
                    divDia.classList.add('registrado');
                }

                divDia.addEventListener('click', () => {
                    // Guardar la fecha seleccionada
                    fechaSeleccionadaGlobal = fechaISO;
                    // Abrir la vista de registro
                    abrirRegistroParaDia(fechaISO);
                });
                
                calendarioGrid.appendChild(divDia);
            }
        };
    }

    // --- MÓDULO 3: REGISTRO DIARIO (Nueva Lógica) ---
    
    function abrirRegistroParaDia(fecha) {
        tituloRegistroDia.textContent = `Registrar para el ${fecha}`;
        ejerciciosDelDia.innerHTML = '';
        txtComentarioDia.value = '';
        
        // Rellenar el <select> con las rutinas disponibles
        cargarRutinasEnSelect();
        
        // Mostrar la sección
        mostrarSeccion('seccion-registro-diario');
    }

    // Carga las rutinas de la BD en el <select>
    function cargarRutinasEnSelect() {
        selectRutinaDelDia.innerHTML = '<option value="">-- Selecciona una rutina --</option>';
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const rutina = cursor.value;
                const option = document.createElement('option');
                option.value = rutina.id; // Guardamos el ID
                option.textContent = rutina.nombre;
                selectRutinaDelDia.appendChild(option);
                cursor.continue();
            }
        };
    }

    // Evento para cuando el usuario elige una rutina del <select>
    selectRutinaDelDia.addEventListener('change', (event) => {
        const rutinaId = parseInt(event.target.value);
        if (isNaN(rutinaId) || !rutinaId) {
            ejerciciosDelDia.innerHTML = '';
            return;
        }

        // Buscar la rutina seleccionada en la BD
        const transaction = db.transaction(['rutinas'], 'readonly');
        const store = transaction.objectStore('rutinas');
        const getRequest = store.get(rutinaId);

        getRequest.onsuccess = (event) => {
            const rutina = getRequest.result;
            if (rutina) {
                // Mostrar los ejercicios de esa rutina
                mostrarEjerciciosParaRegistrar(rutina.ejercicios);
            }
        };
    });

    // Muestra los campos para anotar las repeticiones
    function mostrarEjerciciosParaRegistrar(ejercicios) {
        ejerciciosDelDia.innerHTML = '';
        ejercicios.forEach((ej, index) => {
            const divEj = document.createElement('div');
            divEj.className = 'ejercicio-para-registrar';
            divEj.innerHTML = `<strong>${ej.nombre} (${ej.series} series)</strong>`;

            // Crear inputs para cada serie
            for (let i = 1; i <= ej.series; i++) {
                const label = document.createElement('label');
                label.textContent = ` Serie ${i}: `;
                const input = document.createElement('input');
                input.type = 'number';
                input.placeholder = 'Reps';
                input.className = 'rep-input';
                // Usamos data-attributes para saber a qué ejercicio y serie pertenece
                input.dataset.ejercicioIndex = index;
                input.dataset.serieIndex = i - 1;
                
                divEj.appendChild(label);
                divEj.appendChild(input);
            }
            ejerciciosDelDia.appendChild(divEj);
        });
    }

    // Botón final para guardar el entrenamiento del día
    btnGuardarRegistro.addEventListener('click', () => {
        if (!fechaSeleccionadaGlobal) {
            alert('Error: no hay fecha seleccionada.');
            return;
        }

        // Recolectar datos de las repeticiones
        const inputsReps = document.querySelectorAll('.rep-input');
        const registroEjercicios = []; // Aquí guardaremos {nombre: 'Press', reps: [10, 8, 6]}

        // Agrupar las repeticiones por ejercicio
        const ejerciciosRegistrados = {};

        inputsReps.forEach(input => {
            const ejIndex = input.dataset.ejercicioIndex;
            const repValue = input.value ? parseInt(input.value) : 0;
            
            if (!ejerciciosRegistrados[ejIndex]) {
                const nombre = document.querySelector(`.ejercicio-para-registrar:nth-child(${parseInt(ejIndex) + 1}) strong`).textContent.split(' (')[0];
                ejerciciosRegistrados[ejIndex] = { nombre: nombre, reps: [] };
            }
            ejerciciosRegistrados[ejIndex].reps.push(repValue);
        });

        // Convertir el objeto a un array
        const registroFinalEjercicios = Object.values(ejerciciosRegistrados);

        // Crear el objeto de registro completo
        const registroDelDia = {
            fecha: fechaSeleccionadaGlobal,
            rutinaId: parseInt(selectRutinaDelDia.value),
            rutinaNombre: selectRutinaDelDia.options[selectRutinaDelDia.selectedIndex].text,
            ejercicios: registroFinalEjercicios,
            comentario: txtComentarioDia.value
        };

        // Guardar en la BD (en el almacén 'registros')
        const transaction = db.transaction(['registros'], 'readwrite');
        const store = transaction.objectStore('registros');
        // 'put' sobreescribirá si ya existe un registro para ese día
        const putRequest = store.put(registroDelDia); 

        putRequest.onsuccess = () => {
            alert('¡Entrenamiento guardado para el día ' + fechaSeleccionadaGlobal + '!');
            renderizarCalendario(); // Recargar calendario para mostrar el día en verde
            mostrarSeccion('seccion-calendario'); // Volver al calendario
        };

        putRequest.onerror = (event) => {
            console.error('Error al guardar el registro:', event);
            alert('Error al guardar.');
        };
    });
});