// =================================================================================
// --- MÓDULO DE VISTA: REGISTRO DE ACTIVIDAD (VERSIÓN 1) ---
//
// --- DESCRIPCIÓN ---
// Este módulo crea una vista para mostrar un registro de auditoría de todas las
// acciones importantes que ocurren en la aplicación. Presenta los datos en un
// formato de línea de tiempo para una fácil visualización.
// =================================================================================
/* global lucide */

export const actividadModule = (() => {
    // Dependencias
    let appState, uiService, dataService;
    let containerElement = null;

    // Estado local del módulo
    const state = {
        log: [],
        isLoading: true,
    };

    function init(dependencies) {
        appState = dependencies.appState;
        uiService = dependencies.uiService;
        dataService = dependencies.dataService;
    }

    // =================================================================================
    // --- LÓGICA PRINCIPAL Y RENDERIZADO ---
    // =================================================================================

    function runLogic(container) {
        containerElement = container;
        fetchDataAndRender();

        // No se necesitan listeners de eventos por ahora, es una vista de solo lectura.
        return () => {};
    }

    async function fetchDataAndRender() {
        state.isLoading = true;
        render();

        try {
            // Usamos la colección que ya se está escuchando, pero la ordenamos por fecha
            const activityLog = [...(appState.collections.activity_log || [])];
            activityLog.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
            state.log = activityLog;
        } catch (error) {
            console.error("Error al obtener el registro de actividad:", error);
            uiService.showToast("No se pudo cargar el registro de actividad.", "error");
            state.log = [];
        } finally {
            state.isLoading = false;
            render();
        }
    }

    function render() {
        if (!containerElement) return;

        if (state.isLoading) {
            containerElement.innerHTML = `<div class="loading-spinner mx-auto"></div>`;
            return;
        }

        containerElement.innerHTML = `
            <div class="animate-fade-in-up space-y-6 max-w-5xl mx-auto">
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-800">Registro de Actividad</h2>
                    <p class="text-slate-500 mt-1">Un historial de todas las acciones importantes realizadas en la aplicación.</p>
                </div>
                <div class="space-y-8">
                    ${state.log.length > 0 ? state.log.map(entry => renderLogEntry(entry)).join('') : renderEmptyState()}
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    function renderLogEntry(entry) {
        const timestamp = entry.timestamp ? entry.timestamp.toDate() : new Date();
        const formattedDate = timestamp.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
        const formattedTime = timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const iconMap = {
            creó: 'plus-circle',
            actualizó: 'edit-2',
            eliminó: 'trash-2',
            cambió: 'refresh-cw',
        };
        const actionVerb = entry.action.split(' ')[0];
        const icon = iconMap[actionVerb] || 'activity';

        return `
            <div class="flex items-start gap-4">
                <!-- Icono y Línea de Tiempo -->
                <div class="flex flex-col items-center flex-shrink-0">
                    <div class="bg-slate-100 rounded-full p-2">
                        <i data-lucide="${icon}" class="w-5 h-5 text-slate-500"></i>
                    </div>
                    <div class="w-px h-full bg-slate-200 mt-2"></div>
                </div>

                <!-- Contenido del Registro -->
                <div class="flex-grow pb-8">
                    <div class="flex justify-between items-center">
                        <p class="text-sm text-slate-700">
                            <span class="font-bold">${entry.userName || 'Usuario desconocido'}</span> ${entry.action}
                            ${entry.documentName ? `<span class="font-semibold text-blue-600">"${entry.documentName}"</span>` : ''}
                        </p>
                        <span class="text-xs text-slate-400 flex-shrink-0 ml-4">${formattedDate} a las ${formattedTime} hs</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderEmptyState() {
        return `
            <div class="bg-white p-10 rounded-xl text-center shadow-md border">
                <i data-lucide="history" class="mx-auto h-12 w-12 text-slate-400 mb-4"></i>
                <h3 class="text-xl font-bold text-slate-800">No hay actividad registrada</h3>
                <p class="mt-2 text-slate-500">Aún no se han realizado acciones que queden guardadas en el historial.</p>
            </div>
        `;
    }

    return { init, runLogic };
})();
