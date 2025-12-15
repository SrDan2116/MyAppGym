import { initDB } from './db.js';
import { mostrarSeccion } from './utils.js';
import { initRutinas } from './ui_rutinas.js';
import { initCalendario, renderizarCalendario } from './ui_calendario.js';
import { initPeso } from './ui_peso.js';
import { initConfiguracion } from './ui_configuracion.js';
import { initDieta } from './ui_dieta.js';

// Selectores de Navegación
const btnNavHome = document.getElementById('btn-nav-home');
const btnNavCalendario = document.getElementById('btn-nav-calendario');
const btnNavRutinas = document.getElementById('btn-nav-rutinas');
const btnNavPeso = document.getElementById('btn-nav-peso');
const btnNavDieta = document.getElementById('btn-nav-dieta');
const btnNavConfig = document.getElementById('btn-nav-config');
const btnVolverCalendario = document.getElementById('btn-volver-calendario');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const db = await initDB();

        initRutinas(db);
        initCalendario(db);
        initPeso(db);
        initConfiguracion(db);
        initDieta(db);

        // Listeners de navegación
        btnNavHome.addEventListener('click', () => mostrarSeccion('seccion-home'));
        btnNavCalendario.addEventListener('click', () => mostrarSeccion('seccion-calendario'));
        btnNavRutinas.addEventListener('click', () => mostrarSeccion('seccion-gestor-rutinas'));
        btnNavPeso.addEventListener('click', () => mostrarSeccion('seccion-peso'));
        btnNavDieta.addEventListener('click', () => mostrarSeccion('seccion-dieta'));
        btnNavConfig.addEventListener('click', () => mostrarSeccion('seccion-configuracion'));
        
        btnVolverCalendario.addEventListener('click', () => {
            renderizarCalendario();
            mostrarSeccion('seccion-calendario');
        });

        mostrarSeccion('seccion-home');
        
    } catch (error) {
        console.error('Error fatal al iniciar la aplicación:', error);
    }
});