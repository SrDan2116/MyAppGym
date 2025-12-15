let db;

// Estructura de datos
let comidasDelDia = []; 
let fechaSeleccionada = '';

// Selectores
const inputFecha = document.getElementById('fecha-dieta');
const contenedorComidas = document.getElementById('contenedor-comidas');
const btnAgregarSnack = document.getElementById('btn-agregar-snack');
const btnGuardarDia = document.getElementById('btn-guardar-dia-dieta');

// Selectores de Totales
const totalCal = document.getElementById('total-calorias');
const totalProt = document.getElementById('total-proteinas');
const totalCarb = document.getElementById('total-carbs');
const totalGras = document.getElementById('total-grasas');

// Selectores del Modal
const modal = document.getElementById('modal-editar-comida');
const modalTitulo = document.getElementById('modal-titulo-comida');
const modalDesc = document.getElementById('modal-txt-descripcion');
const modalBtnCalcular = document.getElementById('modal-btn-calcular');
const modalEstadoIA = document.getElementById('modal-estado-ia');
const modalResultadoDiv = document.getElementById('modal-resultado-macros');
const modalInpCal = document.getElementById('modal-cal');
const modalInpProt = document.getElementById('modal-prot');
const modalInpCarb = document.getElementById('modal-carb');
const modalInpGras = document.getElementById('modal-gras');
const modalBtnConfirmar = document.getElementById('modal-btn-confirmar');
const modalBtnCancelar = document.getElementById('modal-btn-cancelar');

let indiceEditando = null; 

export function initDieta(database) {
    db = database;

    const hoy = new Date();
    fechaSeleccionada = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
    inputFecha.value = fechaSeleccionada;

    inputFecha.addEventListener('change', (e) => {
        fechaSeleccionada = e.target.value;
        cargarDietaDelDia();
    });

    btnAgregarSnack.addEventListener('click', agregarSnack);
    btnGuardarDia.addEventListener('click', guardarDiaCompleto);

    modalBtnCalcular.addEventListener('click', calcularConIA);
    modalBtnCancelar.addEventListener('click', cerrarModal);
    modalBtnConfirmar.addEventListener('click', confirmarEdicionComida);

    cargarDietaDelDia();
}

// --- Gestión de Datos ---

function cargarDietaDelDia() {
    const idDia = fechaSeleccionada;
    const transaction = db.transaction(['dietas'], 'readonly');
    const store = transaction.objectStore('dietas');
    const getRequest = store.get(idDia);

    getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data && data.comidas) {
            comidasDelDia = data.comidas;
        } else {
            comidasDelDia = [
                { nombre: "Desayuno", descripcion: "", macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 } },
                { nombre: "Almuerzo", descripcion: "", macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 } },
                { nombre: "Cena", descripcion: "", macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 } }
            ];
        }
        renderizarComidas();
        actualizarTotales();
    };
}

function agregarSnack() {
    const snacks = comidasDelDia.filter(c => c.nombre.startsWith('Snack')).length;
    comidasDelDia.push({
        nombre: `Snack ${snacks + 1}`,
        descripcion: "",
        macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
    });
    renderizarComidas();
}

function moverComida(index, direccion) {
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= comidasDelDia.length) return;
    [comidasDelDia[index], comidasDelDia[nuevoIndex]] = [comidasDelDia[nuevoIndex], comidasDelDia[index]];
    renderizarComidas();
}

function eliminarComida(index) {
    if (confirm('¿Borrar esta comida?')) {
        comidasDelDia.splice(index, 1);
        renderizarComidas();
        actualizarTotales();
    }
}

// --- Renderizado ---

function renderizarComidas() {
    contenedorComidas.innerHTML = '';
    comidasDelDia.forEach((comida, index) => {
        const div = document.createElement('div');
        div.className = 'comida-card';
        div.innerHTML = `
            <div class="comida-header">
                <span class="comida-titulo">${comida.nombre}</span>
                <div class="comida-controles">
                    <button class="btn-mover-arriba" data-index="${index}">⬆️</button>
                    <button class="btn-mover-abajo" data-index="${index}">⬇️</button>
                    <button class="btn-editar-comida" data-index="${index}">✏️ Editar</button>
                    ${index > 2 ? `<button class="btn-borrar-comida" data-index="${index}" style="background:var(--color-error)">X</button>` : ''}
                </div>
            </div>
            <div class="comida-detalles">
                <p><em>${comida.descripcion || "Sin descripción"}</em></p>
                <p>🔥 ${comida.macros.calorias} kcal | 🥩 P: ${comida.macros.proteinas} | 🍞 C: ${comida.macros.carbohidratos} | 🥑 G: ${comida.macros.grasas}</p>
            </div>
        `;
        contenedorComidas.appendChild(div);
    });

    document.querySelectorAll('.btn-mover-arriba').forEach(b => b.addEventListener('click', (e) => moverComida(parseInt(e.target.dataset.index), -1)));
    document.querySelectorAll('.btn-mover-abajo').forEach(b => b.addEventListener('click', (e) => moverComida(parseInt(e.target.dataset.index), 1)));
    document.querySelectorAll('.btn-editar-comida').forEach(b => b.addEventListener('click', (e) => abrirModal(parseInt(e.target.dataset.index))));
    document.querySelectorAll('.btn-borrar-comida').forEach(b => b.addEventListener('click', (e) => eliminarComida(parseInt(e.target.dataset.index))));
}

function actualizarTotales() {
    let cal = 0, prot = 0, carb = 0, gras = 0;
    comidasDelDia.forEach(c => {
        cal += c.macros.calorias || 0;
        prot += c.macros.proteinas || 0;
        carb += c.macros.carbohidratos || 0;
        gras += c.macros.grasas || 0;
    });
    totalCal.textContent = cal;
    totalProt.textContent = prot;
    totalCarb.textContent = carb;
    totalGras.textContent = gras;
}

// --- Modal y Lógica IA ---

function abrirModal(index) {
    indiceEditando = index;
    const comida = comidasDelDia[index];
    modalTitulo.textContent = `Editar ${comida.nombre}`;
    modalDesc.value = comida.descripcion;
    modalInpCal.value = comida.macros.calorias || '';
    modalInpProt.value = comida.macros.proteinas || '';
    modalInpCarb.value = comida.macros.carbohidratos || '';
    modalInpGras.value = comida.macros.grasas || '';
    modalResultadoDiv.classList.remove('oculto'); 
    modalEstadoIA.textContent = '';
    modal.classList.remove('oculto');
}

function cerrarModal() {
    modal.classList.add('oculto');
    indiceEditando = null;
}

function confirmarEdicionComida() {
    if (indiceEditando === null) return;
    comidasDelDia[indiceEditando].descripcion = modalDesc.value;
    comidasDelDia[indiceEditando].macros = {
        calorias: parseInt(modalInpCal.value) || 0,
        proteinas: parseInt(modalInpProt.value) || 0,
        carbohidratos: parseInt(modalInpCarb.value) || 0,
        grasas: parseInt(modalInpGras.value) || 0
    };
    renderizarComidas();
    actualizarTotales();
    cerrarModal();
}

async function calcularConIA() {
    const texto = modalDesc.value.trim();
    if (!texto) { alert("Describe la comida primero."); return; }

    const apiKey = localStorage.getItem('gym_gemini_api_key');
    if (!apiKey) { alert("Falta API Key en Configuración."); return; }

    modalEstadoIA.textContent = "Calculando...";
    modalBtnCalcular.disabled = true;

    // Prompt estricto para JSON
    const prompt = `
        Analiza nutricionalmente: "${texto}".
        Calcula calorias, proteinas, carbohidratos, grasas.
        Responde SOLO JSON válido:
        { "calorias": 0, "proteinas": 0, "carbohidratos": 0, "grasas": 0 }
    `;

    try {
        // --- CAMBIO A MODELO 2.0-FLASH ---
        // Usamos gemini-2.0-flash como indicaba tu guía.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error(`Error API: ${response.status}`);

        const data = await response.json();
        let textoRespuesta = data.candidates[0].content.parts[0].text;
        
        textoRespuesta = textoRespuesta.replace(/```json/g, '').replace(/```/g, '').trim();

        const macros = JSON.parse(textoRespuesta);

        modalInpCal.value = macros.calorias;
        modalInpProt.value = macros.proteinas;
        modalInpCarb.value = macros.carbohidratos;
        modalInpGras.value = macros.grasas;
        modalEstadoIA.textContent = "¡Cálculo listo!";

    } catch (error) {
        console.error(error);
        modalEstadoIA.textContent = "Error: Verifica tu API Key.";
        alert("Error: " + error.message);
    } finally {
        modalBtnCalcular.disabled = false;
    }
}

// --- Guardado Final ---

function guardarDiaCompleto() {
    const idDia = fechaSeleccionada;
    const registroDia = {
        id: idDia, 
        fecha: fechaSeleccionada,
        comidas: comidasDelDia
    };

    const transaction = db.transaction(['dietas'], 'readwrite');
    const store = transaction.objectStore('dietas');
    store.put(registroDia).onsuccess = () => {
        alert('¡Día guardado correctamente!');
    };
}