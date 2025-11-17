import { formatTime } from './utils.js'; // ¡Importamos la función!

let db;
let fechaSeleccionadaGlobal = null;
let rutinaCompletaSeleccionada = null;
let elapsedSeconds = 0;
let timerInterval = null;

// Selectores del DOM para este módulo
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

    // Asignar listeners de este módulo
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
        mostrarEjerciciosParaRegistrar(diaSeleccionado.ejercicios);
    });

    // Listeners del Cronómetro
    btnTimerStart.addEventListener('click', startTimer);
    btnTimerPause.addEventListener('click', pauseTimer);
    btnTimerReset.addEventListener('click', resetTimer);

    // Cargar datos iniciales
    renderizarCalendario();
}

// --- Funciones "privadas" de este módulo ---
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
        // Usamos una función global de utils.js
        // ¡PERO! utils.js no la exportó. Vamos a tener que llamarla desde main.js
        // Por ahora, lo dejaremos así, lo arreglamos en main.js
        document.getElementById('seccion-registro-diario').classList.remove('oculto');
        document.getElementById('seccion-calendario').classList.add('oculto');
    };
}
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
function guardarRegistro() {
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
    };
    const transaction = db.transaction(['registros'], 'readwrite');
    const store = transaction.objectStore('registros');
    const putRequest = store.put(registroDelDia); 
    putRequest.onsuccess = () => {
        alert('¡Entrenamiento guardado para el día ' + fechaSeleccionadaGlobal + '!');
        renderizarCalendario();
        // Arreglamos esto en main.js
        document.getElementById('seccion-calendario').classList.remove('oculto');
        document.getElementById('seccion-registro-diario').classList.add('oculto');
    };
    putRequest.onerror = (event) => console.error('Error al guardar el registro:', event);
}
// Cronómetro
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