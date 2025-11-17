let db;

// Selectores del DOM
const btnExportar = document.getElementById('btn-exportar-datos');
const btnImportar = document.getElementById('btn-importar-datos');
const inputImportar = document.getElementById('input-importar-archivo');

export function initConfiguracion(database) {
    db = database;

    // Listeners
    btnExportar.addEventListener('click', exportarDatos);
    btnImportar.addEventListener('click', () => {
        // Simular clic en el input de archivo oculto
        inputImportar.click(); 
    });
    inputImportar.addEventListener('change', importarDatos);
}

// --- Funciones del Módulo ---

async function exportarDatos() {
    try {
        console.log("Iniciando exportación...");
        
        // 1. Iniciar transacción y obtener almacenes
        const transaction = db.transaction(['rutinas', 'registros', 'medidas'], 'readonly');
        const storeRutinas = transaction.objectStore('rutinas');
        const storeRegistros = transaction.objectStore('registros');
        const storeMedidas = transaction.objectStore('medidas');
        
        // 2. Leer datos de todos los almacenes
        const rutinas = await storeRequest(storeRutinas.getAll());
        const registros = await storeRequest(storeRegistros.getAll());
        const medidas = await storeRequest(storeMedidas.getAll());

        // 3. Crear el objeto de respaldo
        const respaldo = {
            version: 4, // Versión de tu BD
            fecha: new Date().toISOString(),
            data: {
                rutinas: rutinas,
                registros: registros,
                medidas: medidas
            }
        };

        // 4. Convertir a JSON
        const jsonString = JSON.stringify(respaldo, null, 2);

        // 5. Crear un Blob (archivo en memoria)
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 6. Crear un link temporal y simular clic para descargar
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gym_app_respaldo_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // 7. Limpiar
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('¡Respaldo exportado exitosamente!');
        
    } catch (error) {
        console.error('Error al exportar datos:', error);
        alert('Error al exportar los datos.');
    }
}

function importarDatos(event) {
    const file = event.target.files[0];
    if (!file) {
        return; // No se seleccionó archivo
    }

    if (!confirm('¿Estás seguro? Importar un respaldo borrará TODOS los datos actuales.')) {
        inputImportar.value = null; // Limpiar el input
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const json = e.target.result;
            const respaldo = JSON.parse(json);

            if (!respaldo.data || !respaldo.data.rutinas) {
                throw new Error('Archivo de respaldo no válido.');
            }

            // ¡Iniciamos la escritura!
            const transaction = db.transaction(['rutinas', 'registros', 'medidas'], 'readwrite');
            
            // 1. Borrar datos antiguos
            await storeRequest(transaction.objectStore('rutinas').clear());
            await storeRequest(transaction.objectStore('registros').clear());
            await storeRequest(transaction.objectStore('medidas').clear());
            
            console.log('Datos antiguos borrados.');

            // 2. Importar datos nuevos
            for (const rutina of respaldo.data.rutinas) {
                await storeRequest(transaction.objectStore('rutinas').add(rutina));
            }
            for (const registro of respaldo.data.registros) {
                await storeRequest(transaction.objectStore('registros').add(registro));
            }
            for (const medida of respaldo.data.medidas) {
                await storeRequest(transaction.objectStore('medidas').add(medida));
            }
            
            alert('¡Importación completada! La aplicación se recargará para mostrar los cambios.');
            
            // Recargar la página para que la app lea los nuevos datos
            location.reload(); 

        } catch (error) {
            console.error('Error al importar datos:', error);
            alert('Error al importar el archivo. ¿Estás seguro de que es un respaldo válido?');
        }
    };

    reader.readAsText(file);
}

// Función helper para convertir peticiones de IndexedDB a Promesas (más fácil de usar)
function storeRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}