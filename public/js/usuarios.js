// =================================================================================
// --- MÓDULO DE VISTA: GESTIÓN DE USUARIOS (VERSIÓN 1) ---
//
// --- DESCRIPCIÓN ---
// Este módulo crea una nueva vista de administración accesible solo para
// usuarios con el rol de 'administrador'. Permite ver a todos los usuarios
// de la aplicación y modificar sus roles.
// =================================================================================
/* global lucide */

export const usuariosModule = (() => {
    // Dependencias
    let appState, uiService, dataService;
    let containerElement = null;

    // Estado local del módulo
    const state = {
        usuarios: [],
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

        // Medida de seguridad: Solo los administradores pueden ver esta página
        if (appState.currentUser.role !== 'administrador') {
            container.innerHTML = renderAccessDenied();
            lucide.createIcons();
            return () => {}; // No hacer nada en la limpieza
        }

        fetchDataAndRender();

        const handleClickWrapper = (e) => handleClick(e);
        container.addEventListener('click', handleClickWrapper);

        return () => {
            container.removeEventListener('click', handleClickWrapper);
        };
    }

    async function fetchDataAndRender() {
        state.isLoading = true;
        render();

        try {
            // Usamos la colección 'usuarios' que ya se está escuchando en main.js
            state.usuarios = appState.collections.usuarios || [];
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            uiService.showToast("No se pudieron cargar los usuarios.", "error");
            state.usuarios = [];
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
            <div class="animate-fade-in-up space-y-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-3xl font-extrabold text-slate-800">Gestión de Usuarios</h2>
                    <!-- Aquí podríamos agregar un botón para invitar nuevos usuarios en el futuro -->
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th class="p-4">Nombre</th>
                                <th class="p-4">Email</th>
                                <th class="p-4">Rol Asignado</th>
                                <th class="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200">
                            ${state.usuarios.map(user => renderUserRow(user)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        lucide.createIcons();
    }

    function renderUserRow(user) {
        const roles = ['administrador', 'editor', 'lector'];
        const isCurrentUser = user.uid === appState.currentUser.uid;

        return `
            <tr class="hover:bg-slate-50">
                <td class="p-4 font-medium text-slate-800">${user.name}</td>
                <td class="p-4 text-slate-600">${user.email}</td>
                <td class="p-4">
                    <select data-uid="${user.uid}" name="role-select-${user.uid}" class="w-full max-w-xs p-2 border rounded-md" ${isCurrentUser ? 'disabled' : ''}>
                        ${roles.map(role => `
                            <option value="${role}" ${user.role === role ? 'selected' : ''}>
                                ${role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td class="p-4 text-center">
                    <button data-action="save-role" data-uid="${user.uid}" class="btn btn-primary text-xs !py-1 !px-3" ${isCurrentUser ? 'disabled' : ''}>
                        Guardar Rol
                    </button>
                </td>
            </tr>
        `;
    }

    function renderAccessDenied() {
        return `
            <div class="bg-white p-10 rounded-xl text-center shadow-md border border-red-200">
                <i data-lucide="shield-off" class="mx-auto h-16 w-16 text-red-500 mb-4"></i>
                <h3 class="text-2xl font-bold text-red-800">Acceso Denegado</h3>
                <p class="my-4 text-slate-600">No tienes los permisos de administrador necesarios para ver esta sección.</p>
            </div>
        `;
    }

    // =================================================================================
    // --- MANEJO DE EVENTOS ---
    // =================================================================================

    async function handleClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const uid = target.dataset.uid;

        if (action === 'save-role') {
            const selectElement = containerElement.querySelector(`select[data-uid="${uid}"]`);
            const newRole = selectElement.value;

            uiService.showToast(`Actualizando rol...`, 'info');

            const userToUpdate = { role: newRole };
            const success = await dataService.saveDocument('usuarios', userToUpdate, uid);

            if (success) {
                uiService.showToast('Rol de usuario actualizado con éxito.', 'success');
            } else {
                uiService.showToast('Error al actualizar el rol.', 'error');
            }
            // Los datos se refrescarán automáticamente gracias al listener de main.js
        }
    }

    return { init, runLogic };
})();
