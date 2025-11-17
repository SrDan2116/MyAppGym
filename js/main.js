// Importar funciones de otros módulos
import { initDB } from './db.js';
import { mostrarSeccion } from './utils.js';
import { initRutinas } from './ui_rutinas.js';
import { initCalendario, renderizarCalendario } from './ui_calendario.js';
import { initPeso } from './ui_peso.js';

// --- Selectores de Navegación ---
const btnNavHome = document.getElementById('btn-nav-home');
const btnNavCalendario = document.getElementById('btn-nav-calendario');
const btnNavRutinas = document.getElementById('btn-nav-rutinas');
const btnNavPeso = document.getElementById('btn-nav-peso');
const btnVolverCalendario = document.getElementById('btn-volver-calendario');

// Encender la app cuando el HTML esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Iniciar la Base de Datos y esperar a que esté lista
        const db = await initDB();

        // 2. Iniciar cada módulo, pasándole la conexión a la BD
        initRutinas(db);
        initCalendario(db);
        initPeso(db);

        // 3. Asignar los listeners de navegación principal
        btnNavHome.addEventListener('click', () => mostrarSeccion('seccion-home'));
        btnNavCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));
        btnNavRutinas.addEventListener('click', () => mostrarSeccion('seccion-gestor-rutinas'));
        btnNavPeso.addEventListener('click', () => mostrarSeccion('seccion-peso'));
        
        btnVolverCalendario.addEventListener('click', () => {
            renderizarCalendario(); // Recargar el calendario por si acaso
            mostrarSeccion('seccion-calendario');
        });

        // 4. Mostrar la sección de inicio por defecto
        mostrarSeccion('seccion-home');
        
    } catch (error) {
        console.error('Error fatal al iniciar la aplicación:', error);
        document.body.innerHTML = '<h1>Error al cargar la base de datos.</h1>';
    }
});