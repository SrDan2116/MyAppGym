// Variables "privadas" de este módulo
let db;
let rutinaTemporal = { nombre: '', dias: [] };
let ejerciciosTemporalesParaDia = [];
let idRutinaEditando = null;

// Selectores del DOM para este módulo
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
const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');

// Función principal que "enciende" este módulo
export function initRutinas(database) {
    db = database; // Recibimos la conexión a la BD
    
    // Asignar todos los listeners de este módulo
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

    // Cargar los datos iniciales
    cargarRutinasGuardadas();
}

// --- Funciones "privadas" de este módulo ---
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