import { formatTime } from './utils.js'; // Importamos la función

let db;
let fechaSeleccionadaGlobal = null;
let rutinaCompletaSeleccionada = null;
let elapsedSeconds = 0;
let timerInterval = null;

// Selectores del DOM
const calendarioGrid = document.getElementById('calendario-grid');
const tituloRegistroDia = document.getElementById('titulo-registro-dia');
const timerDisplay = document.getElementById('timer-display');
const btnTimerStart = document.getElementById('btn-timer-start');
const btnTimerPause = document.getElementById('btn-timer-pause');
const btnTimerReset = document.getElementById('btn-timer-reset');
const selectRutinaDelDia = document.getElementById('select-rutina-del-dia');
const contenedorSelectDia = document.getElementById('contenedor-select-dia');
const selectDiaDeRutina = document.getElementById('select-dia-de-rutina');
const ejerciciosDelDia = document.getElementById('ejercicios-del-dia');
const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
const vistaReadonlyRegistro = document.getElementById('vista-readonly-registro');
const formularioEditableRegistro = document.getElementById('formulario-editable-registro');
const readonlyContenido = document.getElementById('readonly-contenido');

export function initCalendario(database) {
    db = database;

    // Listeners
    btnGuardarRegistro.addEventListener('click', guardarRegistro);
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
    selectDiaDeRutina.addEventListener('change', (event) => {
        const diaIndex = parseInt(event.target.value);
        if (isNaN(diaIndex) || !rutinaCompletaSeleccionada) {
            ejerciciosDelDia.innerHTML = ''; return;
        }
        const diaSeleccionado = rutinaCompletaSeleccionada.dias[diaIndex];
        // Llamamos a la nueva función sin datos guardados
        mostrarEjerciciosParaRegistrar(diaSeleccionado.ejercicios);
    });

    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);

    renderizarCalendario();
}

// --- Funciones del Módulo ---
export function renderizarCalendario() {
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
    tituloRegistroDia.textContent = `Registro del ${fecha}`;
    const transaction = db.transaction(['registros'], 'readonly');
    const store = transaction.objectStore('registros');
    const getRequest = store.get(fecha);
    getRequest.onsuccess = () => {
        const registro = getRequest.result;
        if (registro) {
            // ¡MODIFICADO! Llamamos a la nueva función ReadOnly
            renderizarRegistroReadOnly(registro);
            vistaReadonlyRegistro.classList.remove('oculto');
            formularioEditableRegistro.classList.add('oculto');
        } else {
            vistaReadonlyRegistro.classList.add('oculto');
            formularioEditableRegistro.classList.remove('oculto');
            resetTimer(); 
            rutinaCompletaSeleccionada = null;
            ejerciciosDelDia.innerHTML = '';
            contenedorSelectDia.classList.add('oculto');
            cargarRutinasEnSelect();
            selectRutinaDelDia.value = "";
            selectDiaDeRutina.innerHTML = '<option value="">-- Selecciona un día --</option>';
        }
        // Esto lo maneja main.js, pero lo dejamos por si acaso
        document.getElementById('seccion-registro-diario').classList.remove('oculto');
        document.getElementById('seccion-calendario').classList.add('oculto');
    };
}

// ¡MODIFICADO! Función ReadOnly
function renderizarRegistroReadOnly(registro) {
    let html = `
        <p><strong>Rutina:</strong> ${registro.rutinaNombre}</p>
        <p><strong>Día:</strong> ${registro.diaNombre}</p>
        <p><strong>Tiempo Total:</strong> ${formatTime(registro.tiempoTotal)}</p>
        <h4>Ejercicios Registrados:</h4>
    `;
    
    registro.ejercicios.forEach(ej => {
        html += `<p><strong>${ej.nombre}</strong></p><ul>`;
        // ¡NUEVO! Iteramos sobre la nueva estructura de series
        ej.series.forEach((serie, i) => {
            html += `<li>Serie ${i + 1}: <span>${serie.peso} kg &times; ${serie.reps} reps</span></li>`;
        });
        html += '</ul>';
    });
    
    readonlyContenido.innerHTML = html;
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

// ¡MODIFICADO! Mostrar inputs de Peso y Reps
function mostrarEjerciciosParaRegistrar(ejercicios) {
    ejerciciosDelDia.innerHTML = '';
    ejercicios.forEach((ej, index) => {
        const divEj = document.createElement('div');
        divEj.className = 'ejercicio-para-registrar';
        divEj.innerHTML = `<strong>${ej.nombre} (${ej.series} series)</strong>`;
        
        for (let i = 1; i <= ej.series; i++) {
            const divSerie = document.createElement('div');
            divSerie.className = 'serie-registro';
            
            const label = document.createElement('label');
            label.textContent = `Serie ${i}:`;
            
            // Input para PESO
            const inputPeso = document.createElement('input');
            inputPeso.type = 'number';
            inputPeso.placeholder = 'Peso';
            inputPeso.className = 'peso-input';
            inputPeso.dataset.ejercicioIndex = index;
            inputPeso.dataset.serieIndex = i - 1;

            // Input para REPS
            const inputReps = document.createElement('input');
            inputReps.type = 'number';
            inputReps.placeholder = 'Reps';
            inputReps.className = 'rep-input';
            inputReps.dataset.ejercicioIndex = index;
            inputReps.dataset.serieIndex = i - 1;

            divSerie.appendChild(label);
            divSerie.appendChild(inputPeso);
            divSerie.appendChild(document.createTextNode('kg \u00D7')); // Símbolo 'x'
            divSerie.appendChild(inputReps);
            divSerie.appendChild(document.createTextNode('reps'));
            
            divEj.appendChild(divSerie);
        }
        ejerciciosDelDia.appendChild(divEj);
    });
}

// ¡MODIFICADO! Guardar la nueva estructura
function guardarRegistro() {
    if (!fechaSeleccionadaGlobal || !rutinaCompletaSeleccionada) {
        alert('Error: no hay fecha o rutina seleccionada.'); return;
    }
    const diaIndex = parseInt(selectDiaDeRutina.value);
    if (isNaN(diaIndex)) {
        alert('Por favor, selecciona un día de la rutina.'); return;
    }
    pauseTimer(); 
    
    // Obtenemos TODOS los inputs de peso y reps
    const inputsPeso = document.querySelectorAll('.peso-input');
    const inputsReps = document.querySelectorAll('.rep-input');
    
    const ejerciciosRegistrados = {};

    // Asumimos que inputsPeso y inputsReps tienen el mismo orden y longitud
    for (let i = 0; i < inputsReps.length; i++) {
        const inputRep = inputsReps[i];
        const inputPeso = inputsPeso[i];
        
        const ejIndex = inputRep.dataset.ejercicioIndex;
        
        const repValue = inputRep.value ? parseInt(inputRep.value) : 0;
        const pesoValue = inputPeso.value ? parseFloat(inputPeso.value) : 0;
        
        if (!ejerciciosRegistrados[ejIndex]) {
            const nombre = rutinaCompletaSeleccionada.dias[diaIndex].ejercicios[ejIndex].nombre;
            ejerciciosRegistrados[ejIndex] = { nombre: nombre, series: [] }; // ¡Ahora es un array 'series'!
        }
        
        // Añadimos el objeto de la serie
        ejerciciosRegistrados[ejIndex].series.push({ peso: pesoValue, reps: repValue });
    }
    
    const registroFinalEjercicios = Object.values(ejerciciosRegistrados);
    
    const registroDelDia = {
        fecha: fechaSeleccionadaGlobal,
        rutinaId: rutinaCompletaSeleccionada.id,
        rutinaNombre: rutinaCompletaSeleccionada.nombre,
        diaIndex: diaIndex,
        diaNombre: rutinaCompletaSeleccionada.dias[diaIndex].nombreDia,
        ejercicios: registroFinalEjercicios, // ¡Nueva estructura!
        tiempoTotal: elapsedSeconds
    };

    const transaction = db.transaction(['registros'], 'readwrite');
    const store = transaction.objectStore('registros');
    const putRequest = store.put(registroDelDia); 

    putRequest.onsuccess = () => {
        alert('¡Entrenamiento guardado para el día ' + fechaSeleccionadaGlobal + '!');
        renderizarCalendario();
        // Esto lo maneja main.js
        document.getElementById('seccion-calendario').classList.remove('oculto');
        document.getElementById('seccion-registro-diario').classList.add('oculto');
    };
    putRequest.onerror = (event) => console.error('Error al guardar el registro:', event);
}

// Cronómetro (Sin cambios)
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