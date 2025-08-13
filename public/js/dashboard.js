// =================================================================================
// --- MÓDULO DE VISTA: DASHBOARD PRINCIPAL (VERSIÓN 2) ---
//
// --- DESCRIPCIÓN ---
// Se añaden gráficos interactivos para una mejor visualización de los datos.
// El dashboard ahora incluye un gráfico de dona para productos por cliente y
// un gráfico de barras para la actividad de los usuarios.
// =================================================================================
/* global lucide, Chart */

export const dashboardModule = (() => {
    // Dependencias
    let appState, uiService, switchView;
    let containerElement = null;
    let charts = {}; // Para mantener referencias a los gráficos y destruirlos

    // Estado local del módulo
    const state = {
        stats: {},
        recentActivity: [],
        isLoading: true,
    };

    function init(dependencies) {
        appState = dependencies.appState;
        uiService = dependencies.uiService;
        switchView = dependencies.switchView;
    }

    // =================================================================================
    // --- LÓGICA PRINCIPAL Y RENDERIZADO ---
    // =================================================================================

    function runLogic(container) {
        containerElement = container;
        fetchDataAndRender();
        
        const handleClickWrapper = (e) => handleClick(e);
        container.addEventListener('click', handleClickWrapper);

        return () => {
            container.removeEventListener('click', handleClickWrapper);
            // Destruir gráficos al salir de la vista para liberar memoria
            Object.values(charts).forEach(chart => chart.destroy());
            charts = {};
        };
    }

    async function fetchDataAndRender() {
        state.isLoading = true;
        render();

        try {
            state.stats = {
                productos: appState.collections.productos?.length || 0,
                proyectos: appState.collections.proyectos?.length || 0,
                clientes: appState.collections.clientes?.length || 0,
                usuarios: appState.collections.usuarios?.length || 0,
            };

            const activityLog = [...(appState.collections.activity_log || [])];
            activityLog.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
            state.recentActivity = activityLog.slice(0, 5);

        } catch (error) {
            console.error("Error al obtener datos para el dashboard:", error);
            uiService.showToast("No se pudo cargar el dashboard.", "error");
        } finally {
            state.isLoading = false;
            render();
        }
    }

    function render() {
        if (!containerElement) return;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        containerElement.innerHTML = `
            <div class="animate-fade-in-up space-y-8">
                <div>
                <p class="text-sm font-medium text-slate-500 capitalize">${formattedDate}</p>
                <h2 class="text-3xl font-extrabold text-slate-800 mt-1">Bienvenido, ${appState.currentUser.name}</h2>
                    <p class="text-slate-500 mt-1">Aquí tienes un resumen de la actividad reciente y el estado del sistema.</p>
                </div>

                <!-- Sección de Estadísticas (KPIs) -->
                ${renderStatsSection()}

                <!-- Nueva Fila para Gráficos -->
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div class="lg:col-span-3">
                        ${renderChartCard('userActivityChart', 'Actividad de Usuarios (Últimos 7 días)')}
                    </div>
                    <div class="lg:col-span-2">
                        ${renderChartCard('productsByClientChart', 'Distribución de Productos por Cliente')}
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Columna Principal: Actividad Reciente -->
                    <div class="lg:col-span-2">
                        ${renderRecentActivitySection()}
                    </div>
                    <!-- Columna Lateral: Accesos Directos -->
                    <div class="lg:col-span-1">
                        ${renderQuickActionsSection()}
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        
        if (!state.isLoading) {
            renderUserActivityChart();
            renderProductsByClientChart();
        }
    }

    function renderStatsSection() {
        if (state.isLoading) {
            return `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${Array(4).fill('').map(() => `
                        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <div class="h-6 w-2/3 bg-slate-200 rounded animate-pulse mb-2"></div>
                            <div class="h-8 w-1/3 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const statsCards = [
            { label: 'Productos Totales', value: state.stats.productos, icon: 'package' },
            { label: 'Proyectos Activos', value: state.stats.proyectos, icon: 'folder-kanban' },
            { label: 'Clientes Registrados', value: state.stats.clientes, icon: 'users' },
            { label: 'Usuarios del Sistema', value: state.stats.usuarios, icon: 'user-check' },
        ];

        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                ${statsCards.map(stat => `
                    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
                        <div>
                            <p class="text-sm text-slate-500 font-medium">${stat.label}</p>
                            <p class="text-3xl font-bold text-slate-800 mt-1">${stat.value}</p>
                        </div>
                        <div class="bg-blue-100 text-blue-600 p-3 rounded-lg">
                            <i data-lucide="${stat.icon}" class="h-6 w-6"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function renderChartCard(canvasId, title) {
        return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 class="text-lg font-bold text-slate-800 mb-4">${title}</h3>
                <div class="h-64">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
    }

    function renderRecentActivitySection() {
        return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
                ${state.isLoading ? `
                    <div class="space-y-4">
                        ${Array(5).fill('').map(() => `
                            <div class="flex items-center gap-4">
                                <div class="h-10 w-10 bg-slate-200 rounded-full animate-pulse"></div>
                                <div class="flex-grow">
                                    <div class="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                                    <div class="h-3 bg-slate-200 rounded w-1/2 mt-2 animate-pulse"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="space-y-2">
                        ${state.recentActivity.length > 0 ? state.recentActivity.map(entry => `
                            <div class="flex items-start gap-4 p-2 rounded-md hover:bg-slate-50">
                                <div class="bg-slate-100 rounded-full p-2 mt-1">
                                    <i data-lucide="activity" class="w-5 h-5 text-slate-500"></i>
                                </div>
                                <div class="flex-grow">
                                    <p class="text-sm text-slate-700">
                                        <span class="font-bold">${entry.userName}</span> ${entry.action}
                                        ${entry.documentName ? `<span class="font-semibold text-blue-600">"${entry.documentName}"</span>` : ''}
                                    </p>
                                    <p class="text-xs text-slate-400">${timeAgo(entry.timestamp?.toDate())}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-sm text-slate-500 text-center p-4">No hay actividad reciente.</p>'}
                    </div>
                `}
            </div>
        `;
    }

    function renderQuickActionsSection() {
        const actions = [
        { label: 'Agregar Producto', view: 'productos', icon: 'package-plus', color: 'blue' },
        { label: 'Agregar Cliente', view: 'clientes', icon: 'user-plus', color: 'indigo' },
        { label: 'Nuevo Flujograma', view: 'flujograma', icon: 'git-branch-plus', color: 'green' },
        { label: 'Ver Actividad', view: 'actividad', icon: 'history', color: 'slate' },
        ];

        return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Accesos Directos</h3>
            <div class="grid grid-cols-2 gap-4">
                    ${actions.map(action => `
                    <a href="#" data-action="navigate" data-view="${action.view}"
                       class="flex flex-col items-center justify-center p-4 rounded-lg bg-${action.color}-50 text-${action.color}-600 hover:bg-${action.color}-100 hover:text-${action.color}-700 border border-${action.color}-200 transition-all duration-200 transform hover:scale-105">
                        <i data-lucide="${action.icon}" class="w-8 h-8 mb-2"></i>
                        <span class="font-semibold text-sm text-center">${action.label}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // =================================================================================
    // --- LÓGICA DE GRÁFICOS ---
    // =================================================================================

    function renderProductsByClientChart() {
        const ctx = document.getElementById('productsByClientChart')?.getContext('2d');
        if (!ctx) return;

        const productsByClient = (appState.collections.productos || []).reduce((acc, product) => {
            const clientName = appState.collectionsById.clientes?.get(product.clienteId)?.descripcion || 'Sin Cliente';
            acc[clientName] = (acc[clientName] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(productsByClient);
        const data = Object.values(productsByClient);

        if (charts.productsByClientChart) charts.productsByClientChart.destroy();
        charts.productsByClientChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Productos',
                    data: data,
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#64748b'],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                }
            }
        });
    }

    function renderUserActivityChart() {
        const ctx = document.getElementById('userActivityChart')?.getContext('2d');
        if (!ctx) return;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivity = (appState.collections.activity_log || []).filter(entry => entry.timestamp?.toDate() > sevenDaysAgo);

        const activityByUser = recentActivity.reduce((acc, entry) => {
            const userName = entry.userName || 'Desconocido';
            acc[userName] = (acc[userName] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(activityByUser);
        const data = Object.values(activityByUser);

        if (charts.userActivityChart) charts.userActivityChart.destroy();
        charts.userActivityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Acciones realizadas',
                    data: data,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // =================================================================================
    // --- MANEJO DE EVENTOS Y UTILIDADES ---
    // =================================================================================

    function handleClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const view = target.dataset.view;

        if (action === 'navigate') {
            e.preventDefault();
            if (view === 'productos' || view === 'clientes') {
                switchView(view);
                setTimeout(() => {
                    const addBtn = document.querySelector('#app-view [data-action="add-new"]');
                    addBtn?.click();
                }, 100);
            } else {
                switchView(view);
            }
        }
    }

    function timeAgo(date) {
        if (!date) return 'hace un momento';
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `hace ${Math.floor(interval)} años`;
        interval = seconds / 2592000;
        if (interval > 1) return `hace ${Math.floor(interval)} meses`;
        interval = seconds / 86400;
        if (interval > 1) return `hace ${Math.floor(interval)} días`;
        interval = seconds / 3600;
        if (interval > 1) return `hace ${Math.floor(interval)} horas`;
        interval = seconds / 60;
        if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
        return `hace ${Math.floor(seconds)} segundos`;
    }

    return { init, runLogic };
})();
