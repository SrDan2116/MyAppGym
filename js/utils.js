// --- Selectores de Secciones ---
const seccionHome = document.getElementById('seccion-home');
const seccionCalendario = document.getElementById('seccion-calendario');
const seccionGestorRutinas = document.getElementById('seccion-gestor-rutinas');
const seccionPeso = document.getElementById('seccion-peso');
const seccionRegistroDiario = document.getElementById('seccion-registro-diario');
const seccionConfiguracion = document.getElementById('seccion-configuracion');
// ¡NUEVO! Agregamos el selector de la sección Dieta
const seccionDieta = document.getElementById('seccion-dieta'); 

export function mostrarSeccion(idSeccion) {
    // Ocultamos TODAS las secciones primero
    seccionHome.classList.add('oculto');
    seccionCalendario.classList.add('oculto');
    seccionGestorRutinas.classList.add('oculto');
    seccionRegistroDiario.classList.add('oculto');
    seccionPeso.classList.add('oculto');
    seccionConfiguracion.classList.add('oculto');
    if (seccionDieta) seccionDieta.classList.add('oculto'); 
    
    // Mostramos la elegida
    const seccion = document.getElementById(idSeccion);
    if (seccion) seccion.classList.remove('oculto');
}

export function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}