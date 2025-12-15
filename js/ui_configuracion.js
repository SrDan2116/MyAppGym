let db;

// Selectores del DOM
const btnExportar = document.getElementById('btn-exportar-datos');
const btnImportar = document.getElementById('btn-importar-datos');
const inputImportar = document.getElementById('input-importar-archivo');
const inputApiKey = document.getElementById('input-api-key');
const btnGuardarApiKey = document.getElementById('btn-guardar-api-key');

export function initConfiguracion(database) {
    db = database;

    // Cargar API Key si existe al iniciar
    const savedKey = localStorage.getItem('gym_gemini_api_key');
    if (savedKey) {
        inputApiKey.value = savedKey;
        console.log("API Key cargada desde memoria.");
    }

    // Listener para GUARDAR KEY
    if(btnGuardarApiKey) {
        btnGuardarApiKey.addEventListener('click', () => {
            const key = inputApiKey.value.trim();
            if (key) {
                localStorage.setItem('gym_gemini_api_key', key);
                alert('¡ÉXITO! API Key guardada en este celular.');
            } else {
                alert('Error: La casilla está vacía. Pega tu API Key primero.');
            }
        });
    } else {
        console.error("Error: No se encontró el botón btn-guardar-api-key en el HTML");
    }

    // Listeners de Exportar/Importar
    btnExportar.addEventListener('click', exportarDatos);
    btnImportar.addEventListener('click', () => inputImportar.click());
    inputImportar.addEventListener('change', importarDatos);
}

// --- Funciones del Módulo (Exportar/Importar) ---

async function exportarDatos() {
    try {
        const transaction = db.transaction(['rutinas', 'registros', 'medidas', 'dietas'], 'readonly');
        
        const rutinas = await storeRequest(transaction.objectStore('rutinas').getAll());
        const registros = await storeRequest(transaction.objectStore('registros').getAll());
        const medidas = await storeRequest(transaction.objectStore('medidas').getAll());
        const dietas = await storeRequest(transaction.objectStore('dietas').getAll());

        const respaldo = {
            version: 6,
            fecha: new Date().toISOString(),
            data: { rutinas, registros, medidas, dietas }
        };

        const jsonString = JSON.stringify(respaldo, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gym_app_respaldo_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('¡Respaldo exportado exitosamente!');
    } catch (error) {
        console.error('Error al exportar:', error);
        alert('Error al exportar los datos.');
    }
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Importar borrará TODOS los datos actuales. ¿Seguro?')) {
        inputImportar.value = null; return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = e.target.result;
            const respaldo = JSON.parse(json);

            const transaction = db.transaction(['rutinas', 'registros', 'medidas', 'dietas'], 'readwrite');
            
            await storeRequest(transaction.objectStore('rutinas').clear());
            await storeRequest(transaction.objectStore('registros').clear());
            await storeRequest(transaction.objectStore('medidas').clear());
            await storeRequest(transaction.objectStore('dietas').clear());

            for (const r of respaldo.data.rutinas || []) await storeRequest(transaction.objectStore('rutinas').add(r));
            for (const r of respaldo.data.registros || []) await storeRequest(transaction.objectStore('registros').add(r));
            for (const r of respaldo.data.medidas || []) await storeRequest(transaction.objectStore('medidas').add(r));
            for (const r of respaldo.data.dietas || []) await storeRequest(transaction.objectStore('dietas').add(r));
            
            alert('¡Importación completada! Recargando...');
            location.reload(); 
        } catch (error) {
            console.error('Error importar:', error);
            alert('Error al importar el archivo.');
        }
    };
    reader.readAsText(file);
}

function storeRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}