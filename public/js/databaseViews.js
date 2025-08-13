// =================================================================================
// --- MÓDULO DE VISTA: GESTOR DE DATOS v50 (VERSIÓN 39) ---
//
// --- CAMBIOS REALIZADOS (VERSIÓN 39) ---
// 1.  **LÓGICA DE TARJETAS MEJORADA:** Se ha implementado una lógica más
//     inteligente para generar el subtítulo en la vista de tarjetas. El sistema
//     ahora busca datos relevantes en un orden de prioridad (relaciones,
//     versión, id) para evitar mostrar el mensaje "Sin asignar".
// =================================================================================
/* global lucide */

export const databaseViewsModule = (() => {
    // Dependencias
    let appState, uiService, dataService, switchView, schemas;
    let currentCollection = '';
    let containerElement = null;

    // Estado local del módulo
    const state = {
        data: [],
        totalCount: 0,
        isLoading: true,
        isSaving: false,
        isDetailViewEditing: false,
        isAddingInTable: false,
        editingDocId: null,
        selectedDocId: null,
        selectedRows: new Set(),
        activeDetailTab: 'details',
        validationErrors: {},
        searchTerm: '',
        filters: {},
        currentPage: 1,
        itemsPerPage: 12,
        sortColumn: 'id',
        sortDirection: 'asc',
        savedViews: [],
        currentViewId: 'default',
        lastVisibleDoc: null,
        pageSnapshots: { 1: null },
        viewMode: 'card',
        visibleColumns: [],
    };

    function init(dependencies) {
        appState = dependencies.appState;
        uiService = dependencies.uiService;
        dataService = dependencies.dataService;
        switchView = dependencies.switchView;
        schemas = dependencies.schemas;
    }

    // =================================================================================
    // --- LÓGICA DE ESTADO Y PERSISTENCIA ---
    // =================================================================================

    function saveStateToSession() {
        const stateToSave = {
            searchTerm: state.searchTerm,
            filters: state.filters,
            currentPage: state.currentPage,
            sortColumn: state.sortColumn,
            sortDirection: state.sortDirection,
            viewMode: state.viewMode,
            visibleColumns: state.visibleColumns,
        };
        sessionStorage.setItem(`db_view_state_${currentCollection}`, JSON.stringify(stateToSave));
    }

    function loadStateFromSession() {
        const savedState = sessionStorage.getItem(`db_view_state_${currentCollection}`);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            Object.assign(state, parsedState);
        }
    }

    // =================================================================================
    // --- LÓGICA PRINCIPAL Y CICLO DE VIDA ---
    // =================================================================================

    async function runLogic(container, payload) {
        containerElement = container;
        currentCollection = appState.currentView;

        Object.assign(state, { data: [], totalCount: 0, isLoading: true, isSaving: false, isDetailViewEditing: false, isAddingInTable: false, editingDocId: null, selectedDocId: null, selectedRows: new Set(), activeDetailTab: 'details', validationErrors: {}, searchTerm: '', filters: {}, currentPage: 1, lastVisibleDoc: null, pageSnapshots: { 1: null }, currentViewId: 'default', viewMode: 'card', visibleColumns: [] });

        loadStateFromSession();

        if (state.visibleColumns.length === 0) {
            const schema = schemas[currentCollection] || schemas.default;
            state.visibleColumns = Object.keys(schema).filter(key => key !== 'docId' && !schema[key].hidden && key !== 'formattingRules').slice(0, 2);
        }

        renderLayout();

        await loadSavedViews();
        fetchDataAndRender();

        const debouncedSearch = debounce((e) => handleSearchInput(e), 350);

        container.addEventListener('click', handleClick);
        container.addEventListener('input', debouncedSearch);
        container.addEventListener('change', handleChange);
        container.addEventListener('submit', handleFormSubmit);
        container.addEventListener('dblclick', handleDblClick);

        return () => {
            container.removeEventListener('click', handleClick);
            container.removeEventListener('input', debouncedSearch);
            container.removeEventListener('change', handleChange);
            container.removeEventListener('submit', handleFormSubmit);
            container.removeEventListener('dblclick', handleDblClick);
            const modal = document.getElementById('detail-modal-backdrop');
            if (modal) modal.remove();
        };
    }

    async function fetchDataAndRender() {
        state.isLoading = true;
        updateContent();

        const combinedFilters = { ...state.filters };
        if (state.searchTerm) {
            const mainField = schemas[currentCollection]?.descripcion ? 'descripcion' : 'id';
            combinedFilters[mainField] = state.searchTerm;
        }

        try {
            const { data, totalCount, lastVisible } = await dataService.getData(currentCollection, {
                filters: combinedFilters,
                sortColumn: state.sortColumn,
                sortDirection: state.sortDirection,
                page: state.currentPage,
                itemsPerPage: state.itemsPerPage,
                startAfterDoc: state.pageSnapshots[state.currentPage]
            });

            state.data = data;
            state.totalCount = totalCount;
            state.lastVisibleDoc = lastVisible;
            if (lastVisible) {
                state.pageSnapshots[state.currentPage + 1] = lastVisible;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            uiService.showToast("Error al cargar los datos.", "error");
            state.data = [];
            state.totalCount = 0;
        } finally {
            state.isLoading = false;
            updateHeader();
            updateContent();
        }
    }

    // =================================================================================
    // --- MOTOR DE RENDERIZADO ---
    // =================================================================================

    function renderLayout() {
        if (!containerElement) return;
        containerElement.innerHTML = `
            <div class="animate-fade-in-up space-y-6">
                <div id="view-header"></div>
                <div id="bulk-actions-container"></div>
                <div id="main-content-container"></div>
            </div>
        `;
        lucide.createIcons();
    }

    function updateHeader() {
        const headerContainer = containerElement.querySelector('#view-header');
        if (headerContainer) {
            headerContainer.innerHTML = generateDashboardHeaderHTML();
            lucide.createIcons();
        }
    }

    function updateContent() {
        const mainContentContainer = containerElement.querySelector('#main-content-container');
        if (!mainContentContainer) return;

        if (state.totalCount === 0 && !state.isLoading && Object.keys(state.filters).length === 0 && !state.searchTerm) {
            mainContentContainer.innerHTML = generateEmptyCollectionStateHTML();
            lucide.createIcons();
            return;
        }

        mainContentContainer.innerHTML = generateViewHTML(state.data);
        lucide.createIcons();
    }

    async function updateDetailModal() {
        const modalBackdrop = document.getElementById('detail-modal-backdrop');
        if (modalBackdrop) {
            const modalContent = modalBackdrop.querySelector('#detail-modal-content');
            if (modalContent) {
                modalContent.innerHTML = await generateDetailModalContent();
                if (state.activeDetailTab === 'history') {
                    await generateHistoryTabContent(state.selectedDocId);
                }
                lucide.createIcons();
            }
        }
    }

    function updateToolbars() {
        const bulkActionsContainer = containerElement.querySelector('#bulk-actions-container');
        if (bulkActionsContainer) {
            bulkActionsContainer.innerHTML = generateBulkActionsToolbar();
            lucide.createIcons();
        }
    }

    // =================================================================================
    // --- ARQUITECTURA DE TEMPLATES ---
    // =================================================================================

    function generateViewHTML(paginatedData) {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                <div class="p-4 border-b border-slate-200 flex flex-col gap-4">
                    <div class="flex justify-between items-center gap-4">
                        <div class="relative flex-grow">
                            <label for="master-search-input" class="sr-only">Buscar en ${currentCollection}</label>
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"></i>
                            <input type="text" id="master-search-input" name="master-search" value="${state.searchTerm}" placeholder="Buscar por descripción..." class="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                            ${state.searchTerm ? `<button data-action="clear-search" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"><i data-lucide="x" class="h-4 w-4"></i></button>` : ''}
                        </div>
                        <div class="flex items-center gap-2">
                            <button data-action="open-filter-panel" class="btn btn-secondary"><i data-lucide="filter" class="mr-2 h-4 w-4"></i>Filtros</button>
                            ${state.viewMode === 'table' ? generateColumnSelectorHTML() : ''}
                            ${generateViewModeToggleHTML()}
                        </div>
                    </div>
                    ${generateActiveFiltersHTML()}
                </div>
                <div id="master-list-container">
                    ${state.isLoading ?
                        (state.viewMode === 'card' ? generateSkeletonCards() : generateSkeletonTable()) :
                        (paginatedData.length > 0 ?
                            (state.viewMode === 'card' ? `<div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">${paginatedData.map(item => generateMasterCardHTML(item)).join('')}</div>` : generateTableViewHTML(paginatedData)) :
                            generateEmptyStateRow())
                    }
                </div>
                ${generatePaginationControlsHTML()}
            </div>
        `;
    }

    function generateDashboardHeaderHTML() {
        const schema = schemas[currentCollection] || schemas.default;
        let stats = [{ label: `Total de ${currentCollection}`, value: state.totalCount, icon: 'hash' }];

        if (currentCollection === 'productos' && appState.collections.productos) {
            const activeCount = appState.collections.productos.filter(p => p.isActivo).length;
            const uniqueClients = new Set(appState.collections.productos.map(p => p.clienteId)).size;
            stats.push({ label: 'Productos Activos', value: activeCount, icon: 'check-circle' });
            stats.push({ label: 'Clientes Únicos', value: uniqueClients, icon: 'users' });
        }

        return `
            <div>
                <div class="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h2 class="text-3xl font-extrabold capitalize text-slate-800">${currentCollection.replace(/([A-Z])/g, ' $1')}</h2>
                    <div class="flex items-center gap-2">
                        ${generateViewsDropdown()}
                        ${state.viewMode === 'table' ? `<button data-action="add-in-table" class="btn btn-secondary !p-2" title="Agregar Rápido en Tabla"><i data-lucide="plus" class="h-4 w-4"></i></button>` : ''}
                        <button data-action="add-new" class="btn btn-primary"><i data-lucide="file-plus-2" class="mr-2 h-4 w-4"></i>Agregar Nuevo</button>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${stats.map(stat => `
                        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4">
                            <div class="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                <i data-lucide="${stat.icon}" class="h-6 w-6"></i>
                            </div>
                            <div>
                                <p class="text-sm text-slate-500 font-medium">${stat.label}</p>
                                <p class="text-2xl font-bold text-slate-800">${stat.value}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateTableViewHTML(paginatedData) {
        const schema = schemas[currentCollection] || schemas.default;
        const isAllVisibleSelected = paginatedData.length > 0 && paginatedData.every(i => state.selectedRows.has(i.docId));
        return `
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th class="p-4 w-12 text-center"><input type="checkbox" id="select-all-checkbox" name="select-all-checkbox" data-action="select-all-visible" ${isAllVisibleSelected ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"><label for="select-all-checkbox" class="sr-only">Seleccionar todo</label></th>
                            ${state.visibleColumns.map(h => `<th class="p-4"><button data-action="sort" data-column="${h}" class="flex items-center gap-1 font-semibold hover:text-slate-800">${schema[h]?.label || h}${state.sortColumn === h ? `<i data-lucide="${state.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}" class="h-4 w-4 text-blue-600"></i>` : ''}</button></th>`).join('')}
                            <th class="p-4 w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                        ${state.isAddingInTable ? generateQuickAddRowHTML() : ''}
                        ${paginatedData.map(item => generateMasterRowHTML(item, schema)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function generateMasterRowHTML(item, schema) {
        const isChecked = state.selectedRows.has(item.docId);
        const isEditing = state.editingDocId === item.docId;
        const populatedItem = populateData([item], schema)[0];

        let rowClass = 'transition-colors bg-white';
        if (isChecked) rowClass += ' bg-blue-50';
        if (!isEditing) rowClass += ' hover:bg-slate-50';

        if (schema.formattingRules) {
            schema.formattingRules.forEach(rule => {
                if (String(item[rule.key]) === String(rule.value)) {
                    rowClass += ` ${rule.class}`;
                }
            });
        }

        const checkboxId = `select-row-${item.docId}`;
        const mainRow = `
            <tr data-action="select-item" data-doc-id="${item.docId}" class="${rowClass}">
                <td class="p-4 w-12 text-center">
                    <input type="checkbox" id="${checkboxId}" name="${checkboxId}" data-action="select-row" data-doc-id="${item.docId}" ${isChecked ? 'checked' : ''} class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                    <label for="${checkboxId}" class="sr-only">Seleccionar fila</label>
                </td>
                ${state.visibleColumns.map(key => {
            const isEditable = !schema[key]?.readonlyOnEdit && schema[key]?.type !== 'relation' && schema[key]?.type !== 'boolean';
            return `<td class="p-4 font-medium text-slate-700 group ${isEditable ? 'editable-cell' : ''}" data-doc-id="${item.docId}" data-field-key="${key}">
                                <span class="cell-content">${formatDisplayValue(populatedItem[key], schema[key], item)}</span>
                                ${isEditable ? `<i data-lucide="edit-2" class="h-3 w-3 text-slate-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>` : ''}
                           </td>`
        }).join('')}
                <td class="p-4 text-center">
                    <button data-action="toggle-inline-edit" data-doc-id="${item.docId}" class="p-1 text-slate-500 hover:text-blue-600">
                        <i data-lucide="${isEditing ? 'chevron-up' : 'chevron-down'}" class="h-4 w-4 pointer-events-none"></i>
                    </button>
                </td>
            </tr>
        `;

        const editRow = isEditing ? generateInlineEditRowHTML(item, schema) : '';

        return mainRow + editRow;
    }

    function generateQuickAddRowHTML() {
        const schema = schemas[currentCollection] || schemas.default;
        const fields = state.visibleColumns;

        const cells = fields.map(key => {
            const fieldSchema = schema[key];
            return `<td class="p-2">${generateFormField(`quick-add-${key}`, '', fieldSchema, {})}</td>`;
        }).join('');

        return `
            <tr id="quick-add-row" class="bg-blue-50">
                <td class="p-4 text-center"><i data-lucide="plus-circle" class="h-5 w-5 text-blue-500"></i></td>
                ${cells}
                <td class="p-2 text-center">
                    <div class="flex items-center gap-1">
                        <button data-action="save-quick-add" class="btn btn-primary !p-2"><i data-lucide="check" class="h-4 w-4"></i></button>
                        <button data-action="cancel-quick-add" class="btn btn-secondary !p-2"><i data-lucide="x" class="h-4 w-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }

    function generateInlineEditRowHTML(item, schema) {
        const allFields = Object.keys(schema).filter(k => k !== 'formattingRules');
        const colspan = state.visibleColumns.length + 2;

        const formFields = allFields.map(key => {
            const fieldSchema = schema[key];
            if (fieldSchema.hidden) return '';
            return `
                <div class="${fieldSchema.fullWidth ? 'col-span-1 sm:col-span-2 md:col-span-3' : 'col-span-1'}">
                    <label for="inline-edit-${key}-${item.docId}" class="text-xs font-semibold text-slate-500 uppercase">${fieldSchema.label}</label>
                    <div class="mt-1">
                        ${generateFormField(key, item[key], fieldSchema, item, null, 'inline-edit-')}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <tr class="bg-slate-50">
                <td colspan="${colspan}" class="p-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        ${formFields}
                    </div>
                    <div class="flex justify-end items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                        <button data-action="cancel-inline-edit" data-doc-id="${item.docId}" class="btn btn-secondary">Cancelar</button>
                        <button data-action="save-inline-edit" data-doc-id="${item.docId}" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function generateMasterCardHTML(item) {
        const schema = schemas[currentCollection] || schemas.default;
        const populatedItem = populateData([item], schema)[0];
        const title = populatedItem.descripcion || populatedItem.id || 'Sin Título';
        
        // --- LÓGICA DE SUBTÍTULO MEJORADA ---
        const getSubtitle = () => {
            const priorityFields = ['clienteId', 'proveedorId', 'proyectoId', 'procesoId', 'version', 'id'];
            for (const key of priorityFields) {
                if (item[key]) {
                    // Si es una relación, el valor ya viene poblado con la descripción
                    if (schema[key]?.type === 'relation') {
                        return populatedItem[key];
                    }
                    return item[key];
                }
            }
            return item.docId; // Último recurso
        };

        const subtitle = getSubtitle();
        const statusField = Object.keys(schema).find(key => schema[key].type === 'boolean');

        return `
            <div data-action="select-item" data-doc-id="${item.docId}" class="group relative p-5 border-t-4 border-blue-500 rounded-lg cursor-pointer transition-all duration-200 bg-white shadow-md hover:shadow-lg hover:-translate-y-1">
                <div class="flex flex-col">
                    <h3 class="font-bold text-slate-800 truncate text-lg" title="${title}">${title}</h3>
                    <p class="text-sm text-slate-500 truncate" title="${subtitle}">${subtitle || '&nbsp;'}</p>
                    ${statusField ? `<div class="mt-4">${formatDisplayValue(populatedItem[statusField], schema[statusField], item)}</div>` : ''}
                </div>
            </div>
        `;
    }

    function generateBulkActionsToolbar() {
        if (state.selectedRows.size === 0) return '';
        return `
            <div class="bg-blue-600 text-white rounded-xl p-3 mb-4 flex justify-between items-center animate-fade-in-up shadow-lg">
                <p class="font-semibold">${state.selectedRows.size} item(s) seleccionado(s)</p>
                <div class="flex items-center gap-2">
                    <button data-action="bulk-edit" class="btn bg-blue-500 hover:bg-blue-400 border-blue-400"><i data-lucide="edit" class="mr-2 h-4 w-4"></i>Editar Selección</button>
                    <button data-action="bulk-delete" class="btn bg-red-600 hover:bg-red-700"><i data-lucide="trash-2" class="mr-2 h-4 w-4"></i>Eliminar</button>
                </div>
            </div>`;
    }

    function generateActiveFiltersHTML() {
        const activeFilters = Object.entries(state.filters);
        if (activeFilters.length === 0) return '';

        const schema = schemas[currentCollection] || schemas.default;

        const filterPills = activeFilters.map(([key, value]) => {
            const fieldSchema = schema[key];
            let displayValue = value;

            if (fieldSchema?.type === 'relation') {
                const relatedItem = appState.collectionsById[fieldSchema.collection]?.get(value);
                displayValue = relatedItem?.descripcion || value;
            } else if (fieldSchema?.type === 'boolean') {
                displayValue = value === 'true' ? 'Sí' : 'No';
            }

            return `
                <span class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    <strong>${fieldSchema?.label || key}:</strong> ${displayValue}
                    <button data-action="remove-filter" data-key="${key}" class="ml-1 p-0.5 rounded-full hover:bg-blue-200">
                        <i data-lucide="x" class="h-3 w-3 pointer-events-none"></i>
                    </button>
                </span>
            `;
        }).join('');

        return `
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold text-slate-600">Filtros activos:</span>
                ${filterPills}
                <button data-action="clear-all-filters" class="text-sm text-blue-600 hover:underline font-semibold">Limpiar todo</button>
            </div>
        `;
    }

    async function generateDetailModalContent() {
        if (!state.selectedDocId) return '';

        const selectedItem = state.data.find(item => item.docId === state.selectedDocId) || await dataService.getData(currentCollection, { filters: { docId: state.selectedDocId } }).then(res => res.data[0]);
        if (!selectedItem) return `<div class="p-8 text-center"><div class="loading-spinner"></div></div>`;


        const schema = schemas[currentCollection] || schemas.default;
        const populatedItem = populateData([selectedItem], schema)[0];

        let tabContentHTML = '';
        if (state.activeDetailTab === 'details') {
            tabContentHTML = generateDetailsTabContent(selectedItem, schema, populatedItem);
        } else if (state.activeDetailTab === 'related') {
            tabContentHTML = generateRelatedItemsHTML(selectedItem);
        } else if (state.activeDetailTab === 'history') {
            tabContentHTML = `<div class="p-6"><div class="loading-spinner mx-auto"></div></div>`;
        }


        return `
            <div class="p-6 border-b flex justify-between items-start">
                <div>
                    <p class="text-xs font-semibold text-blue-600 uppercase">${currentCollection.slice(0, -1)}</p>
                    <h3 class="text-2xl font-bold text-slate-800 mt-1" title="${populatedItem.descripcion || populatedItem.id}">${populatedItem.descripcion || populatedItem.id}</h3>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button data-action="close-modal" class="btn btn-secondary !p-2" title="Cerrar">
                        <i data-lucide="x" class="h-5 w-5"></i>
                    </button>
                </div>
            </div>
            <div class="border-b border-slate-200">
                <nav class="flex gap-4 px-6 -mb-px">
                    <button data-action="switch-detail-tab" data-tab="details" class="py-4 px-1 border-b-2 font-medium text-sm ${state.activeDetailTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}">Detalles</button>
                    <button data-action="switch-detail-tab" data-tab="related" class="py-4 px-1 border-b-2 font-medium text-sm ${state.activeDetailTab === 'related' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}">Registros Vinculados</button>
                    <button data-action="switch-detail-tab" data-tab="history" class="py-4 px-1 border-b-2 font-medium text-sm ${state.activeDetailTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}">Historial</button>
                </nav>
            </div>
            <div id="detail-tab-content" class="flex-grow overflow-y-auto custom-scrollbar">
                ${tabContentHTML}
            </div>
        `;
    }

    function generateDetailsTabContent(selectedItem, schema, populatedItem) {
        const allSchemaKeys = Object.keys(schema).filter(k => k !== 'formattingRules');
        const errors = state.validationErrors[selectedItem.docId] || {};

        return `
            <div class="p-6">
                <div class="flex justify-end mb-4">
                ${state.isDetailViewEditing ? `
                    <div class="flex items-center gap-2">
                        <button data-action="cancel-detail-edit" data-doc-id="${selectedItem.docId}" class="btn btn-secondary" ${state.isSaving ? 'disabled' : ''}>Cancelar</button>
                        <button data-action="save-detail-edit" data-doc-id="${selectedItem.docId}" class="btn btn-primary" ${state.isSaving ? 'disabled' : ''}>
                            ${state.isSaving ? '<i data-lucide="loader" class="animate-spin h-4 w-4"></i>' : 'Guardar Cambios'}
                        </button>
                    </div>
                ` : `
                    <div class="flex items-center gap-2">
                        <button data-action="edit-item" data-doc-id="${selectedItem.docId}" class="btn btn-secondary"><i data-lucide="edit-2" class="mr-2 h-4 w-4"></i>Editar</button>
                        <button data-action="clone-item" data-doc-id="${selectedItem.docId}" class="btn btn-secondary"><i data-lucide="copy" class="mr-2 h-4 w-4"></i>Clonar</button>
                    </div>
                `}
                </div>
                <div class="grid grid-cols-2 gap-x-6 gap-y-4">
                    ${allSchemaKeys.map(key => {
            const fieldId = `${key}-${selectedItem.docId}`;
            const labelTag = `<p class="text-xs font-semibold text-slate-500 uppercase">${schema[key]?.label || key}</p>`;
            return `
                        <div class="${schema[key]?.fullWidth ? 'col-span-2' : 'col-span-1'}">
                            ${labelTag}
                            <div class="mt-1 text-sm">
                                ${state.isDetailViewEditing ? generateFormField(key, selectedItem[key], schema[key], selectedItem, errors[key]) : formatDisplayValue(populatedItem[key], schema[key], selectedItem)}
                            </div>
                        </div>
                    `}).join('')}
                </div>
                ${!state.isDetailViewEditing ? generateAuditTrailHTML(selectedItem) : ''}
            </div>
        `;
    }

    function generateRelatedItemsHTML(selectedItem) {
        const relatedItems = [];
        const currentId = selectedItem.docId;

        for (const collectionName in schemas) {
            if (collectionName === currentCollection) continue;

            const schema = schemas[collectionName];
            for (const key in schema) {
                if (schema[key].type === 'relation' && schema[key].collection === currentCollection) {
                    const itemsInCollection = appState.collections[collectionName] || [];
                    const foundItems = itemsInCollection.filter(item => item[key] === currentId);

                    if (foundItems.length > 0) {
                        relatedItems.push({
                            collection: collectionName,
                            label: schemas[collectionName].label || collectionName.charAt(0).toUpperCase() + collectionName.slice(1),
                            items: foundItems
                        });
                    }
                }
            }
        }

        if (relatedItems.length === 0) {
            return `<div class="p-8 text-center text-slate-500">
                        <i data-lucide="link-2-off" class="mx-auto h-12 w-12 text-slate-400 mb-4"></i>
                        <h4 class="font-semibold text-lg">No hay registros vinculados</h4>
                        <p>No se encontraron otros documentos que hagan referencia a este registro.</p>
                   </div>`;
        }

        return `<div class="p-6 space-y-6">
                    ${relatedItems.map(group => `
                        <div>
                            <h4 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">${group.label} (${group.items.length})</h4>
                            <div class="space-y-2">
                                ${group.items.map(item => `
                                    <a href="#" data-action="navigate-to-relation" data-collection="${group.collection}" data-doc-id="${item.docId}" class="block p-3 bg-white border rounded-lg hover:bg-slate-50 hover:border-blue-500 transition-colors">
                                        <p class="font-semibold text-blue-600">${item.descripcion || item.id}</p>
                                        <p class="text-xs text-slate-500">ID: ${item.id}</p>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>`;
    }

    async function generateHistoryTabContent(docId) {
        const historyContainer = document.querySelector('#detail-tab-content');
        if (!historyContainer) return;

        historyContainer.innerHTML = '<div class="p-6"><div class="loading-spinner mx-auto"></div></div>';

        const history = await dataService.getVersionHistory(currentCollection, docId);

        if (!history || history.length === 0) {
            historyContainer.innerHTML = `<div class="p-8 text-center text-slate-500">
                        <i data-lucide="history" class="mx-auto h-12 w-12 text-slate-400 mb-4"></i>
                        <h4 class="font-semibold text-lg">Sin Historial de Versiones</h4>
                        <p>No se han registrado cambios para este documento.</p>
                   </div>`;
            lucide.createIcons();
            return;
        }

        historyContainer.innerHTML = `<div class="p-6 space-y-3">
            ${history.map(version => `
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 pt-1">
                        <span class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center" title="${version.savedBy}">
                            <i data-lucide="user" class="w-5 h-5 text-slate-600"></i>
                        </span>
                    </div>
                    <div class="flex-grow bg-white border rounded-lg p-3">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm text-slate-700">
                                    Versión guardada por <span class="font-semibold">${version.savedBy.split('@')[0]}</span>
                                </p>
                                <p class="text-xs text-slate-500">${formatAuditValue(version.savedAt)}</p>
                            </div>
                            <button data-action="restore-version" data-doc-id="${docId}" data-version-id="${version.versionId}" class="btn btn-secondary text-xs !py-1 !px-2">
                                <i data-lucide="rotate-ccw" class="h-3 w-3 mr-1"></i>
                                Cargar esta versión
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`;
        lucide.createIcons();
    }

    function generateColumnSelectorHTML() {
        const schema = schemas[currentCollection] || schemas.default;
        const allColumns = Object.keys(schema).filter(key => key !== 'docId' && !schema[key].hidden && key !== 'formattingRules');

        return `
            <div class="relative ml-2" id="column-selector">
                <button data-action="toggle-column-selector" class="btn btn-secondary !p-2" title="Personalizar Columnas">
                    <i data-lucide="columns" class="h-4 w-4"></i>
                </button>
                <div id="column-selector-menu" class="hidden absolute top-full right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-20 p-2 space-y-1">
                    ${allColumns.map(key => {
            const fieldId = `column-select-${key}`;
            return `
                        <label for="${fieldId}" class="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                            <input type="checkbox" id="${fieldId}" name="${fieldId}" data-column-key="${key}" class="h-4 w-4 mr-3" ${state.visibleColumns.includes(key) ? 'checked' : ''}>
                            <span class="text-sm font-medium text-slate-700">${schema[key]?.label || key}</span>
                        </label>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    function generateFormField(key, value, fieldSchema, item, error, prefix = '') {
        const fieldType = fieldSchema?.type || 'text';
        const isReadonly = fieldSchema?.readonlyOnEdit;
        const errorClass = error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300';
        const commonClasses = `w-full bg-white mt-1 p-1 border rounded-md shadow-sm text-sm ${errorClass}`;
        const fieldName = `${key}-${item.docId || 'quick-add'}`;
        const fieldId = `${prefix}${fieldName}`;

        if (isReadonly && item.docId) {
            return `<input type="text" id="${fieldId}" name="${fieldName}" class="${commonClasses} bg-slate-100" value="${value || ''}" readonly>`;
        }

        const inputHtml = (() => {
            switch (fieldType) {
                case 'boolean':
                    return `<input type="checkbox" id="${fieldId}" name="${fieldName}" data-field="${key}" class="h-5 w-5 mt-1" ${value ? 'checked' : ''}>`;
                case 'relation':
                    const relatedCollection = appState.collections[fieldSchema.collection] || [];
                    return `<select id="${fieldId}" name="${fieldName}" data-field="${key}" class="${commonClasses}"><option value="">Seleccionar...</option>${relatedCollection.map(relItem => `<option value="${relItem.docId}" ${relItem.docId === value ? 'selected' : ''}>${relItem.descripcion || relItem.id}</option>`).join('')}</select>`;
                case 'select':
                     const options = fieldSchema.options || [];
                     return `<select id="${fieldId}" name="${fieldName}" data-field="${key}" class="${commonClasses}"><option value="">Seleccionar...</option>${options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
                case 'textarea':
                    return `<textarea id="${fieldId}" name="${fieldName}" data-field="${key}" class="${commonClasses}" rows="3">${value || ''}</textarea>`;
                default:
                    return `<input type="${fieldType}" id="${fieldId}" name="${fieldName}" data-field="${key}" class="${commonClasses}" value="${value || ''}">`;
            }
        })();

        return `<div>${inputHtml}${error ? `<p class="text-red-600 text-xs mt-1">${error}</p>` : ''}</div>`;
    }

    function generateAuditTrailHTML(item) {
        const createdBy = item.creadoPor || null;
        const modifiedBy = item.modificadoPor || null;

        if (!createdBy && !modifiedBy) return '';

        const auditEntries = [
            { action: 'creó este registro', user: createdBy, date: item.fechaCreacion },
            { action: 'actualizó este registro', user: modifiedBy, date: item.fechaModificacion }
        ];

        return `
            <div class="mt-4 pt-4 border-t border-slate-200">
                <h4 class="text-xs font-bold text-slate-500 uppercase mb-3">Historial de Modificaciones</h4>
                <div class="space-y-3">
                    ${auditEntries.filter(e => e.user && e.date).map(entry => {
            const userName = entry.user.split('@')[0];
            const avatarChar = userName.charAt(0).toUpperCase();
            return `
                        <div class="flex items-center gap-3">
                            <div class="flex-shrink-0">
                                <span class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600" title="${entry.user}">${avatarChar}</span>
                            </div>
                            <div>
                                <p class="text-sm text-slate-700">
                                    <span class="font-semibold">${userName}</span> ${entry.action}
                                </p>
                                <p class="text-xs text-slate-500">${formatAuditValue(entry.date)}</p>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    function generateSkeletonTable() {
        const colspan = state.visibleColumns.length + 2;
        return `
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead><tr>${Array.from({ length: colspan }).map(() => '<th class="p-4"><div class="h-4 bg-slate-200 rounded animate-pulse"></div></th>').join('')}</tr></thead>
                    <tbody>${generateSkeletonRows(colspan)}</tbody>
                </table>
            </div>
        `;
    }

    function generateViewModeToggleHTML() { return `<div class="flex items-center rounded-lg bg-slate-100 p-1"><button data-action="toggle-view-mode" data-mode="card" class="btn !p-1.5 text-sm ${state.viewMode === 'card' ? 'bg-white shadow-sm' : 'bg-transparent text-slate-500'}" title="Vista de Tarjetas"><i data-lucide="layout-grid" class="h-4 w-4"></i></button><button data-action="toggle-view-mode" data-mode="table" class="btn !p-1.5 text-sm ${state.viewMode === 'table' ? 'bg-white shadow-sm' : 'bg-transparent text-slate-500'}" title="Vista de Tabla"><i data-lucide="list" class="h-4 w-4"></i></button></div>`; }
    function generatePaginationControlsHTML() { const totalPages = Math.ceil(state.totalCount / state.itemsPerPage); if (totalPages <= 1) return ''; const startIndex = (state.currentPage - 1) * state.itemsPerPage; const endIndex = Math.min(startIndex + state.itemsPerPage, state.totalCount); return `<div class="flex justify-between items-center text-sm p-4 border-t border-slate-200"><span class="text-slate-600">Mostrando <b>${startIndex + 1}</b>-<b>${endIndex}</b> de <b>${state.totalCount}</b></span><form data-action="jump-to-page" class="flex items-center gap-2"><label for="page-input" class="sr-only">Saltar a página</label><span>Página</span><input type="number" id="page-input" name="page-input" class="w-16 p-1 border rounded-md text-center" value="${state.currentPage}" min="1" max="${totalPages}"><span class="text-slate-500">de ${totalPages}</span></form></div>`; }
    function generateViewsDropdown() { const currentViewName = state.savedViews.find(v => v.id === state.currentViewId)?.name || 'Vista por Defecto'; return `<div class="relative" id="views-dropdown"><button data-action="toggle-views-dropdown" class="btn btn-secondary"><i data-lucide="view" class="mr-2 h-4 w-4"></i><span>${currentViewName}</span><i data-lucide="chevron-down" class="ml-2 h-4 w-4"></i></button><div id="views-menu" class="hidden absolute top-full right-0 mt-2 w-64 bg-white border rounded-lg shadow-xl z-10"><div class="p-2 border-b"><div class="flex justify-between items-center p-2 rounded-md hover:bg-slate-100"><a href="#" data-action="select-view" data-view-id="default" class="flex-grow font-medium text-sm">Vista por Defecto</a></div>${state.savedViews.map(view => `<div class="flex justify-between items-center p-2 rounded-md hover:bg-slate-100"><a href="#" data-action="select-view" data-view-id="${view.id}" class="flex-grow font-medium text-sm">${view.name}</a><button data-action="delete-view" data-view-id="${view.id}" class="p-1 text-red-400 hover:text-red-600"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button></div>`).join('')}</div><div class="p-2"><label for="new-view-name" class="sr-only">Nombre de nueva vista</label><input type="text" id="new-view-name" name="new-view-name" class="w-full p-2 border rounded-md text-sm" placeholder="Nombre de nueva vista..."><button data-action="save-view" class="btn btn-primary w-full mt-2 text-sm">Guardar Vista Actual</button></div></div></div>`; }
    function generateEmptyStateRow() { return `<div class="text-center p-12 text-slate-500"><i data-lucide="search-x" class="mx-auto h-12 w-12 text-slate-400 mb-4"></i><h4 class="font-semibold text-lg">No se encontraron resultados</h4><p>Intenta ajustar tus filtros o agrega un nuevo registro.</p></div>`; }
    function generateSkeletonRows(colspan) { return Array.from({ length: 5 }).map(() => `<tr><td class="p-4 w-12 text-center"><div class="h-4 w-4 bg-slate-200 rounded animate-pulse"></div></td>${Array.from({ length: colspan - 1 }).map(() => `<td class="p-4"><div class="h-4 bg-slate-200 rounded animate-pulse"></div></td>`).join('')}</tr>`).join(''); }
    function generateSkeletonCards() { return `<div class="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">${Array.from({ length: 8 }).map(() => `<div class="p-5 border-t-4 border-slate-200 rounded-lg bg-white shadow-md"><div class="h-6 bg-slate-200 rounded w-3/4 mb-3 animate-pulse"></div><div class="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div><div class="h-8 bg-slate-200 rounded w-1/3 mt-4 animate-pulse"></div></div>`).join('')}</div>`; }
    function generateEmptyCollectionStateHTML() { return `<div class="text-center p-16 bg-white rounded-xl shadow-sm border border-slate-200"><div class="inline-block bg-blue-100 text-blue-600 p-4 rounded-full"><i data-lucide="database" class="h-12 w-12"></i></div><h3 class="mt-6 text-2xl font-bold text-slate-800">Base de Datos de ${currentCollection}</h3><p class="mt-2 text-slate-500 max-w-md mx-auto">Aún no hay registros en esta colección. ¡Crea el primero para empezar a organizar tu información!</p><button data-action="add-new" class="btn btn-primary mt-8"><i data-lucide="plus" class="mr-2 h-4 w-4"></i>Agregar Nuevo Registro</button></div>`; }

    // =================================================================================
    // --- LÓGICA DE DATOS Y EVENTOS ---
    // =================================================================================

    function populateData(data, schema) { return data.map(item => { const populatedItem = { ...item }; for (const key in schema) { if (key === 'formattingRules') continue; if (schema[key]?.type === 'relation' && populatedItem[key]) { const { collection, field = 'descripcion' } = schema[key]; const relatedDoc = appState.collectionsById[collection]?.get(populatedItem[key]); populatedItem[key] = relatedDoc ? relatedDoc[field] || `ID: ${populatedItem[key]}` : `<span class="text-red-500">Relación Rota</span>`; } } return populatedItem; }); }
    async function validate(data, schema, isNew, docId) { const errors = {}; for (const key in schema) { if (key === 'formattingRules') continue; if (schema[key].required && !data[key]) { errors[key] = 'Este campo es requerido.'; } if (schema[key].type === 'email' && data[key] && !/\S+@\S+\.\S+/.test(data[key])) { errors[key] = 'Formato de email inválido.'; } } const idKey = 'id'; if (schema[idKey] && data[idKey]) { const idExists = await dataService.checkIdExists(currentCollection, data[idKey], isNew ? null : docId); if (idExists) { errors[idKey] = 'Este código ya está en uso.'; } } return errors; }
    function debounce(func, delay) { let timeout; return function (...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; }
    function formatDisplayValue(value, fieldSchema, item) { if (value === undefined || value === null || value === '') return '<span class="text-slate-400">Sin asignar</span>'; if (fieldSchema?.type === 'boolean') { return value ? '<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Activo</span>' : '<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Inactivo</span>'; } if (fieldSchema?.type === 'relation' && item[fieldSchema.key]) { return `<a href="#" data-action="navigate-to-relation" data-collection="${fieldSchema.collection}" data-doc-id="${item[fieldSchema.key]}" class="text-blue-600 hover:underline font-semibold">${value}</a>`; } if (fieldSchema?.type === 'email') { return `<span class="flex items-center gap-2"><i data-lucide="mail" class="h-4 w-4 text-slate-400"></i>${value}</span>`; } if (fieldSchema?.type === 'tel') { return `<span class="flex items-center gap-2"><i data-lucide="phone" class="h-4 w-4 text-slate-400"></i>${value}</span>`; } return value; }
    function formatAuditValue(value) { if (value?.toDate) { return value.toDate().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } return value; }

    function handleFormSubmit(e) {
        const target = e.target.closest('form[data-action="jump-to-page"]');
        if (target) {
            e.preventDefault();
            const pageInput = target.querySelector('input[name="page-input"]');
            const page = parseInt(pageInput.value, 10);
            const totalPages = Math.ceil(state.totalCount / state.itemsPerPage);
            if (page >= 1 && page <= totalPages) {
                state.currentPage = page;
                fetchDataAndRender();
            } else {
                uiService.showToast(`Página inválida. Debe ser entre 1 y ${totalPages}.`, 'error');
                pageInput.value = state.currentPage;
            }
        }
    }

    function handleClick(e) {
        const target = e.target.closest('[data-action]');

        if (!target) {
            if (!e.target.closest('#views-dropdown')) document.getElementById('views-menu')?.classList.add('hidden');
            if (!e.target.closest('#column-selector')) document.getElementById('column-selector-menu')?.classList.add('hidden');
            return;
        }

        const action = target.dataset.action;
        const docId = target.dataset.docId;

        if (action !== 'select-row' && action !== 'select-all-visible') {
            e.preventDefault();
        }

        const actions = {
            'select-item': () => {
                state.selectedDocId = docId;
                state.isDetailViewEditing = false;
                openDetailModal();
            },
            'select-row': (event) => { event.stopPropagation(); const checkbox = document.getElementById(`select-row-${docId}`); if (checkbox) { checkbox.checked ? state.selectedRows.add(docId) : state.selectedRows.delete(docId); } updateToolbars(); },
            'select-all-visible': () => { const allVisibleSelected = state.data.length > 0 && state.data.every(i => state.selectedRows.has(i.docId)); if (allVisibleSelected) { state.data.forEach(i => state.selectedRows.delete(i.docId)); } else { state.data.forEach(i => state.selectedRows.add(i.docId)); } updateContent(); updateToolbars(); },
            'add-new': () => handleAddNew(),
            'add-in-table': () => handleAddInTable(),
            'save-quick-add': () => handleSaveQuickAdd(),
            'cancel-quick-add': () => { state.isAddingInTable = false; updateContent(); },
            'toggle-inline-edit': () => handleToggleInlineEdit(docId),
            'save-inline-edit': () => handleSaveInlineEdit(docId),
            'cancel-inline-edit': () => { state.editingDocId = null; updateContent(); },
            'delete': (ev) => { ev.stopPropagation(); handleDelete(docId); },
            'bulk-delete': () => handleBulkDelete(),
            'bulk-edit': () => handleBulkEdit(),
            'export-csv': () => exportToCSV(),
            'sort': () => { const column = target.dataset.column; if (state.sortColumn === column) { state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc'; } else { state.sortColumn = column; state.sortDirection = 'asc'; } state.currentPage = 1; state.pageSnapshots = { 1: null }; fetchDataAndRender(); },
            'toggle-views-dropdown': () => document.getElementById('views-menu')?.classList.toggle('hidden'),
            'select-view': () => handleSelectView(target.dataset.viewId),
            'delete-view': () => handleDeleteView(target.dataset.viewId),
            'save-view': () => handleSaveView(),
            'clear-search': () => { state.searchTerm = ''; state.currentPage = 1; state.pageSnapshots = { 1: null }; fetchDataAndRender(); },
            'toggle-column-selector': () => document.getElementById('column-selector-menu')?.classList.toggle('hidden'),
            'toggle-view-mode': () => { state.viewMode = target.dataset.mode; saveStateToSession(); updateHeader(); updateContent(); },
            'open-filter-panel': () => openFilterPanel(),
            'remove-filter': () => { delete state.filters[target.dataset.key]; state.currentPage = 1; state.pageSnapshots = { 1: null }; fetchDataAndRender(); },
            'clear-all-filters': () => { state.filters = {}; state.currentPage = 1; state.pageSnapshots = { 1: null }; fetchDataAndRender(); }
        };

        if (actions[action]) actions[action](e);
    }

    function handleChange(e) {
        const target = e.target.closest('[data-column-key]');
        if (target?.dataset.columnKey) {
            const key = target.dataset.columnKey;
            if (target.checked) {
                if (!state.visibleColumns.includes(key)) state.visibleColumns.push(key);
            } else {
                state.visibleColumns = state.visibleColumns.filter(c => c !== key);
            }
            saveStateToSession();
            updateContent();
        }
    }

    function handleDblClick(e) {
        const cell = e.target.closest('.editable-cell');
        if (!cell || cell.querySelector('input')) return;

        const docId = cell.dataset.docId;
        const fieldKey = cell.dataset.fieldKey;
        const item = state.data.find(i => i.docId === docId);
        const cellContent = cell.querySelector('.cell-content');
        const originalValue = item[fieldKey] || '';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalValue;
        input.className = 'w-full bg-blue-50 p-1 -m-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';

        cellContent.innerHTML = '';
        cellContent.appendChild(input);
        input.focus();
        input.select();

        const save = async () => {
            const newValue = input.value;
            if (newValue !== originalValue) {
                const dataToSave = { ...item, [fieldKey]: newValue };
                await dataService.saveDocument(currentCollection, dataToSave, docId);
                uiService.showToast('Campo actualizado', 'success');
            }
            fetchDataAndRender();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                fetchDataAndRender();
            }
        });
    }

    async function openDetailModal() {
        state.activeDetailTab = 'details';
        const modalId = 'detail-modal';
        let modal = document.getElementById(`${modalId}-backdrop`);
        if (modal) modal.remove();

        const modalHTML = `
            <div id="${modalId}-backdrop" class="fixed inset-0 modal-backdrop flex items-center justify-center z-[1055]">
                <div id="${modalId}-content" class="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col animate-scale-in max-h-[90vh]">
                    ${await generateDetailModalContent()}
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        const modalEl = document.getElementById(`${modalId}-backdrop`);
        modalEl.addEventListener('click', handleModalClick);
    }

    function closeDetailModal() {
        const modal = document.getElementById('detail-modal-backdrop');
        if (modal) {
            modal.removeEventListener('click', handleModalClick);
            modal.remove();
            state.selectedDocId = null;
            state.isDetailViewEditing = false;
        }
    }

    function handleModalClick(e) {
        const target = e.target.closest('[data-action]');
        if (!target && e.target.id !== 'detail-modal-backdrop') return;

        if (!target) {
            closeDetailModal();
            return;
        }

        const action = target.dataset.action;
        const docId = target.dataset.docId;

        const actions = {
            'close-modal': () => closeDetailModal(),
            'switch-detail-tab': () => { state.activeDetailTab = target.dataset.tab; updateDetailModal(); },
            'edit-item': () => { state.isDetailViewEditing = true; updateDetailModal(); },
            'cancel-detail-edit': () => { state.isDetailViewEditing = false; state.validationErrors = {}; updateDetailModal(); },
            'save-detail-edit': () => handleSave(docId),
            'clone-item': () => handleClone(docId),
            'restore-version': () => handleRestoreVersion(docId, target.dataset.versionId),
            'navigate-to-relation': () => { closeDetailModal(); switchView(target.dataset.collection, { filters: { 'docId': target.dataset.docId } }); }
        };

        if (actions[action]) actions[action]();
    }

    function handleSearchInput(e) { if (e.target.id === 'master-search-input') { state.searchTerm = e.target.value; state.currentPage = 1; state.pageSnapshots = { 1: null }; fetchDataAndRender(); } }
    async function handleSave(docId) { state.isSaving = true; updateDetailModal(); const dataToSave = { ...state.data.find(i => i.docId === docId) }; const schema = schemas[currentCollection] || schemas.default; for (const key in schema) { if (key === 'formattingRules') continue; const input = document.querySelector(`[name="${key}-${docId}"]`); if (input) { dataToSave[key] = input.type === 'checkbox' ? input.checked : input.value; } } const errors = await validate(dataToSave, schema, false, docId); state.validationErrors[docId] = errors; if (Object.keys(errors).length > 0) { uiService.showToast('Error de validación. Revise los campos.', 'error'); state.isSaving = false; updateDetailModal(); return; } const success = await dataService.saveDocument(currentCollection, dataToSave, docId); if (success) { uiService.showToast('Registro actualizado.', 'success'); state.isDetailViewEditing = false; } state.isSaving = false; await fetchDataAndRender(); updateDetailModal(); }
    function handleClone(docId) { closeDetailModal(); const originalItem = state.data.find(item => item.docId === docId); if (!originalItem) return; const clonedData = { ...originalItem }; delete clonedData.docId; delete clonedData.fechaCreacion; delete clonedData.creadoPor; delete clonedData.fechaModificacion; delete clonedData.modificadoPor; if (clonedData.id) clonedData.id = `${clonedData.id}_copia`; handleAddNew(clonedData); }

    function handleAddNew(prefilledData = {}) {
        const schema = schemas[currentCollection] || schemas.default;
        const fields = Object.keys(schema).filter(k => k !== 'formattingRules').map(key => ({ key, ...schema[key] }));
        uiService.showEditPanel({
            title: `Agregar Nuevo ${currentCollection.slice(0, -1)}`,
            schema,
            fields,
            data: prefilledData,
            onSave: async (dataFromModal) => {
                const errors = await validate(dataFromModal, schema, true);
                if (Object.keys(errors).length > 0) return { success: false, errors };
                const success = await dataService.saveDocument(currentCollection, dataFromModal, null);
                if (success) {
                    uiService.showToast('Registro creado.', 'success');
                    fetchDataAndRender();
                }
                return { success };
            }
        });
    }

    function handleAddInTable() {
        if (state.isAddingInTable) return;
        state.isAddingInTable = true;
        updateContent();
    }

    async function handleSaveQuickAdd() {
        const quickAddRow = document.getElementById('quick-add-row');
        if (!quickAddRow) return;

        const newData = {};
        const schema = schemas[currentCollection] || schemas.default;

        quickAddRow.querySelectorAll('[data-field]').forEach(input => {
            newData[input.dataset.field] = input.type === 'checkbox' ? input.checked : input.value;
        });

        const errors = await validate(newData, schema, true);
        if (Object.keys(errors).length > 0) {
            uiService.showToast('Error de validación. Revisa los campos.', 'error');
            return;
        }

        state.isAddingInTable = false;
        state.data.unshift(newData);
        state.totalCount++;
        updateContent();
        uiService.showToast('Registro agregado.', 'success');

        const success = await dataService.saveDocument(currentCollection, newData, null);
        if (!success) {
            uiService.showToast('Error al guardar. Revise los datos.', 'error');
            fetchDataAndRender();
        }
    }

    function handleToggleInlineEdit(docId) {
        if (state.editingDocId === docId) {
            state.editingDocId = null;
        } else {
            state.editingDocId = docId;
        }
        state.isAddingInTable = false;
        updateContent();
    }

    async function handleSaveInlineEdit(docId) {
        const itemToSave = { ...state.data.find(i => i.docId === docId) };
        if (!itemToSave) return;

        const schema = schemas[currentCollection] || schemas.default;
        const allFields = Object.keys(schema).filter(k => k !== 'formattingRules');

        allFields.forEach(key => {
            const input = document.querySelector(`[name="inline-edit-${key}-${docId}"]`);
            if (input) {
                itemToSave[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });

        const errors = await validate(itemToSave, schema, false, docId);
        if (Object.keys(errors).length > 0) {
            uiService.showToast('Error de validación. Revisa los campos.', 'error');
            return;
        }

        const originalIndex = state.data.findIndex(i => i.docId === docId);
        state.data[originalIndex] = itemToSave;
        state.editingDocId = null;
        updateContent();
        uiService.showToast('Registro actualizado.', 'success');

        const success = await dataService.saveDocument(currentCollection, itemToSave, docId);
        if (!success) {
            uiService.showToast('Error al guardar. Revise los datos.', 'error');
            fetchDataAndRender();
        }
    }

    function handleDelete(docId) { const item = state.data.find(i => i.docId === docId); const itemName = item?.descripcion || item?.id || 'este item'; uiService.showConfirmationModal('Eliminar registro', `¿Seguro que quieres eliminar <strong>${itemName}</strong>? La acción no se puede deshacer.`, async () => { const success = await dataService.deleteDocument(currentCollection, docId); if (success) { uiService.showToast('Item eliminado.', 'success'); if (state.selectedDocId === docId) state.selectedDocId = null; state.selectedRows.delete(docId); fetchDataAndRender(); } }); }
    function handleBulkDelete() { uiService.showConfirmationModal(`Eliminar ${state.selectedRows.size} registros`, '¿Seguro que quieres eliminar los items seleccionados?', async () => { const idsToDelete = Array.from(state.selectedRows); const deletePromises = idsToDelete.map(id => dataService.deleteDocument(currentCollection, id)); await Promise.all(deletePromises); uiService.showToast(`${idsToDelete.length} items eliminados.`, 'success'); state.selectedRows.clear(); if (idsToDelete.includes(state.selectedDocId)) { state.selectedDocId = null; } fetchDataAndRender(); }); }
    async function loadSavedViews() { state.savedViews = await dataService.getSavedViews(currentCollection); }
    async function handleSaveView() { const viewNameInput = document.getElementById('new-view-name'); const name = viewNameInput.value.trim(); if (!name) { return uiService.showToast('Por favor, ingrese un nombre para la vista.', 'error'); } const viewConfig = { name, filters: state.filters, sortColumn: state.sortColumn, sortDirection: state.sortDirection, visibleColumns: state.visibleColumns, searchTerm: state.searchTerm }; const savedView = await dataService.saveView(currentCollection, viewConfig); if (savedView) { state.savedViews.push(savedView); state.currentViewId = savedView.id; viewNameInput.value = ''; uiService.showToast(`Vista '${name}' guardada.`, 'success'); updateHeader(); } }
    function handleSelectView(viewId) { if (viewId === 'default') { state.filters = {}; state.sortColumn = 'id'; state.sortDirection = 'asc'; state.searchTerm = ''; state.visibleColumns = []; } else { const selectedView = state.savedViews.find(v => v.id === viewId); if (selectedView) { state.filters = selectedView.filters || {}; state.sortColumn = selectedView.sortColumn || 'id'; state.sortDirection = selectedView.sortDirection || 'asc'; state.searchTerm = selectedView.searchTerm || ''; state.visibleColumns = selectedView.visibleColumns || []; } } if (state.visibleColumns.length === 0) { const schema = schemas[currentCollection] || schemas.default; state.visibleColumns = Object.keys(schema).filter(key => key !== 'docId' && !schema[key].hidden && key !== 'formattingRules').slice(0, 2); } state.currentViewId = viewId; state.currentPage = 1; fetchDataAndRender(); }
    async function handleDeleteView(viewId) { uiService.showConfirmationModal('Eliminar Vista', '¿Seguro que quieres eliminar esta vista guardada?', async () => { const success = await dataService.deleteView(viewId); if (success) { state.savedViews = state.savedViews.filter(v => v.id !== viewId); if (state.currentViewId === viewId) { handleSelectView('default'); } else { updateHeader(); } uiService.showToast('Vista eliminada.', 'success'); } }); }
    function exportToCSV() { uiService.showToast('Generando CSV...', 'info'); const schema = schemas[currentCollection] || schemas.default; const dataToExport = state.data.filter(item => state.selectedRows.size > 0 ? state.selectedRows.has(item.docId) : true); if (dataToExport.length === 0) { uiService.showToast('No hay datos para exportar.', 'error'); return; } const populatedData = populateData(dataToExport, schema); const headers = Object.keys(schema).filter(k => k !== 'formattingRules'); const csvRows = [headers.map(h => schema[h].label || h).join(',')]; for (const row of populatedData) { const values = headers.map(header => { const originalItem = dataToExport.find(item => item.docId === row.docId); const valueToExport = schema[header]?.type === 'relation' ? originalItem[header] : row[header]; const escaped = ('' + (valueToExport || '')).replace(/"/g, '""'); return `"${escaped}"`; }); csvRows.push(values.join(',')); } const csvString = csvRows.join('\n'); const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', `${currentCollection}_export.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); }

    async function handleRestoreVersion(docId, versionId) {
        uiService.showConfirmationModal('Restaurar Versión', '¿Seguro? Esto cargará los datos de esta versión en el panel de edición. Deberás guardar los cambios para confirmar.', async () => {
            const versionData = await dataService.getVersion(currentCollection, docId, versionId);
            if (versionData) {
                const currentData = state.data.find(item => item.docId === docId);
                Object.assign(currentData, versionData, { docId: currentData.docId });

                state.activeDetailTab = 'details';
                state.isDetailViewEditing = true;
                updateDetailModal();
                uiService.showToast('Versión cargada. Guarde para confirmar.', 'info');
            }
        });
    }

    function openFilterPanel() {
        const panelId = 'filter-panel';
        if (document.getElementById(panelId)) return;

        const schema = schemas[currentCollection] || schemas.default;
        const filterableFields = Object.keys(schema).filter(key =>
            !schema[key].readonlyOnEdit && key !== 'formattingRules' && key !== 'id' && key !== 'descripcion'
        );

        let fieldsHTML = filterableFields.map(key => {
            const fieldSchema = schema[key];
            const currentValue = state.filters[key] || '';
            let inputHTML = '';

            switch (fieldSchema.type) {
                case 'boolean':
                    inputHTML = `
                        <select data-filter-key="${key}" class="w-full bg-white mt-1 p-2 border rounded-md shadow-sm text-sm">
                            <option value="" ${currentValue === '' ? 'selected' : ''}>Todos</option>
                            <option value="true" ${currentValue === 'true' ? 'selected' : ''}>Sí</option>
                            <option value="false" ${currentValue === 'false' ? 'selected' : ''}>No</option>
                        </select>`;
                    break;
                case 'relation':
                    const relatedCollection = appState.collections[fieldSchema.collection] || [];
                    inputHTML = `
                        <select data-filter-key="${key}" class="w-full bg-white mt-1 p-2 border rounded-md shadow-sm text-sm">
                            <option value="" ${currentValue === '' ? 'selected' : ''}>Todos</option>
                            ${relatedCollection.map(item => `<option value="${item.docId}" ${item.docId === currentValue ? 'selected' : ''}>${item.descripcion || item.id}</option>`).join('')}</select>`;
                    break;
                default:
                    inputHTML = `<input type="text" data-filter-key="${key}" value="${currentValue}" class="w-full bg-white mt-1 p-2 border rounded-md shadow-sm text-sm" placeholder="Filtrar por ${fieldSchema.label}...">`;
            }

            return `<div>
                        <label class="block text-sm font-medium text-slate-700">${fieldSchema.label}</label>
                        ${inputHTML}
                    </div>`;
        }).join('');

        const panelHTML = `<div id="${panelId}-backdrop" class="fixed inset-0 modal-backdrop z-[1050]"><div id="${panelId}" class="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out"><div class="p-5 border-b flex justify-between items-center"><h2 class="text-xl font-bold text-slate-800">Filtrar Registros</h2><button data-action="close-panel" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-5 space-y-4 flex-grow overflow-y-auto">${fieldsHTML}</div><div class="p-4 border-t bg-slate-50 flex justify-end gap-3"><button data-action="clear-all-filters" class="btn btn-secondary">Limpiar Filtros</button><button data-action="apply-filters" class="btn btn-primary">Aplicar</button></div></div></div>`;

        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = panelHTML;
        lucide.createIcons();

        const panel = document.getElementById(panelId);
        const backdrop = document.getElementById(`${panelId}-backdrop`);
        const closePanel = () => {
            panel.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0');
            backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true });
        };

        setTimeout(() => panel.classList.remove('translate-x-full'), 50);

        backdrop.querySelector('[data-action="close-panel"]').onclick = closePanel;
        backdrop.querySelector('[data-action="apply-filters"]').onclick = () => {
            const newFilters = {};
            panel.querySelectorAll('[data-filter-key]').forEach(input => {
                if (input.value) {
                    newFilters[input.dataset.filterKey] = input.value;
                }
            });
            state.filters = newFilters;
            state.currentPage = 1;
            state.pageSnapshots = { 1: null };
            fetchDataAndRender();
            closePanel();
        };
        backdrop.querySelector('[data-action="clear-all-filters"]').onclick = () => {
            state.filters = {};
            state.currentPage = 1;
            state.pageSnapshots = { 1: null };
            fetchDataAndRender();
            closePanel();
        };
    }

    function handleBulkEdit() {
        if (state.selectedRows.size === 0) return;
        const schema = schemas[currentCollection] || schemas.default;
        const editableFields = Object.keys(schema).filter(k => k !== 'formattingRules' && !schema[k].readonlyOnEdit).map(key => ({ key, ...schema[key] }));

        uiService.showEditPanel({
            title: `Editar ${state.selectedRows.size} Registros`,
            schema,
            fields: editableFields,
            data: {}, // Start with an empty form
            onSave: async (dataFromModal) => {
                const changes = {};
                for (const key in dataFromModal) {
                    if (dataFromModal[key] !== '' && dataFromModal[key] !== null) {
                        changes[key] = dataFromModal[key];
                    }
                }

                if (Object.keys(changes).length === 0) {
                    uiService.showToast('No se realizaron cambios.', 'info');
                    return { success: true };
                }

                uiService.showToast(`Actualizando ${state.selectedRows.size} registros...`, 'info');
                const idsToUpdate = Array.from(state.selectedRows);
                const updatePromises = idsToUpdate.map(id => dataService.saveDocument(currentCollection, changes, id));

                await Promise.all(updatePromises);

                uiService.showToast(`${idsToUpdate.length} registros actualizados.`, 'success');
                state.selectedRows.clear();
                fetchDataAndRender();
                return { success: true };
            }
        });
    }

    return { init, runLogic };
})();
