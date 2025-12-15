let db;
let graficoPesoChart = null; 

// Selectores
const inputPeso = document.getElementById('input-peso');
const inputAltura = document.getElementById('input-altura');
const inputCintura = document.getElementById('input-cintura');
const btnGuardarMedidas = document.getElementById('btn-guardar-medidas');
const listaMedidas = document.getElementById('lista-medidas');
const detalleMedida = document.getElementById('detalle-medida');
const detalleMedidaTitulo = document.getElementById('detalle-medida-titulo');
const detalleMedidaContenido = document.getElementById('detalle-medida-contenido');
const btnCerrarDetalleMedida = document.getElementById('btn-cerrar-detalle-medida');
const canvasGrafico = document.getElementById('grafico-peso');

export function initPeso(database) {
    db = database;

    btnGuardarMedidas.addEventListener('click', guardarMedidas);
    listaMedidas.addEventListener('click', (event) => {
        if (event.target.matches('.registro-fecha')) {
            const fecha = event.target.dataset.fecha;
            mostrarDetalleMedida(fecha);
        }
    });
    btnCerrarDetalleMedida.addEventListener('click', () => {
        detalleMedida.classList.add('oculto');
    });

    // Exportar globales por si main las llama, aunque ya no hace falta
    window.cargarListaMedidas = cargarListaMedidas;
    window.renderizarGraficoPeso = renderizarGraficoPeso;

    cargarListaMedidas();
    renderizarGraficoPeso(); 
}

export function cargarListaMedidas() {
    listaMedidas.innerHTML = '';
    const transaction = db.transaction(['medidas'], 'readonly');
    const store = transaction.objectStore('medidas');
    const request = store.openCursor(null, 'prev'); // Orden descendente

    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const fecha = cursor.value.fecha;
            const div = document.createElement('div');
            div.className = 'registro-fecha';
            div.textContent = `Registro del ${fecha}`;
            div.dataset.fecha = fecha;
            listaMedidas.appendChild(div);
            cursor.continue();
        }
    };
}

export function renderizarGraficoPeso() {
    const transaction = db.transaction(['medidas'], 'readonly');
    const store = transaction.objectStore('medidas');
    const getAllRequest = store.getAll(); 

    getAllRequest.onsuccess = () => {
        const registros = getAllRequest.result;
        // Filtramos solo los que tienen peso
        const datosConPeso = registros.filter(r => r.peso !== null && r.peso > 0);
        
        const labels = datosConPeso.map(r => r.fecha);
        const data = datosConPeso.map(r => r.peso);

        const ctx = canvasGrafico.getContext('2d');
        if (graficoPesoChart) graficoPesoChart.destroy();
        
        graficoPesoChart = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Peso Corporal (kg)',
                    data: data,
                    fill: false,
                    borderColor: '#03DAC6', 
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { ticks: { color: '#B0B0B0' } },
                    y: { ticks: { color: '#B0B0B0' }, beginAtZero: false }
                },
                plugins: { legend: { labels: { color: '#E0E0E0' } } }
            }
        });
    };
}

function guardarMedidas() {
    const hoy = new Date();
    const fechaISO = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
    
    const peso = parseFloat(inputPeso.value);
    const altura = parseFloat(inputAltura.value);
    const cintura = parseFloat(inputCintura.value);

    if (isNaN(peso) && isNaN(altura) && isNaN(cintura)) {
        alert('Debes ingresar al menos un valor.'); return;
    }
    const medidasData = {
        fecha: fechaISO,
        peso: isNaN(peso) ? null : peso,
        altura: isNaN(altura) ? null : altura,
        cintura: isNaN(cintura) ? null : cintura
    };
    
    const transaction = db.transaction(['medidas'], 'readwrite');
    const store = transaction.objectStore('medidas');
    const putRequest = store.put(medidasData);

    putRequest.onsuccess = () => {
        alert('¡Medidas guardadas para hoy!');
        inputPeso.value = ''; inputAltura.value = ''; inputCintura.value = '';
        cargarListaMedidas();
        renderizarGraficoPeso(); 
    };
    putRequest.onerror = (event) => console.error('Error al guardar medidas:', event);
}

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