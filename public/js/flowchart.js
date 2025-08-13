/* global jsPDF, Sortable, lucide, html2canvas, tinycolor */
// =================================================================================
// --- MÓDULO DE FLUJOGRAMA (flowchart.js) ---
//
// --- MEJORAS APLICADAS (VERSIÓN 2) ---
// 1.  **CORRECCIÓN DE ERROR CRÍTICO:** Se ha reemplazado la llamada a la función
//     obsoleta `openProductSearchModal` por la nueva función centralizada
//     `uiService.openSearchModal`, solucionando el error que impedía
//     seleccionar un producto para crear un flujograma.
// =================================================================================

export const flowchartModule = (() => {

    // =================================================================================
    // --- 1. DEPENDENCIAS Y ESTADO DEL MÓDULO ---
    // =================================================================================

    // Dependencias que se inyectarán desde main.js
    let appState, dom, uiService, dataService, switchView, db, firestore, COLLECTIONS;

    // Flags y referencias del módulo
    let isInitialized = false;
    let unsubscribeFromLock = null;
    let sortableInstances = [];

    // Estado local del módulo de flujograma
    const state = {
        processes: [],
        transportFlows: [],
        header: {
            organizacion: 'Barack Mercosul',
            locacion_planta: 'Los Arboles 842, Hurlingham, Buenos Aires, Argentina',
            proyecto: '',
            docId: '',
            fecha_inicio: '',
            fecha_ultima_revision: '',
            responsable_elaboracion: '',
            revision: ''
        },
        lastUpdated: null,
        updatedBy: '',
        isLocked: false,
        lockedBy: '',
        hasUnsavedChanges: false,
        linkingTransportState: {
            isActive: false,
            fromId: null,
        },
        minimap: {
            zoom: 1,
            viewBox: { x: 0, y: 0, width: 0, height: 0 },
            isPanning: false,
            panStart: { x: 0, y: 0 }
        }
    };

    // Referencias a elementos del DOM para evitar búsquedas repetitivas
    const ui = {
        headerContainer: null,
        actionsContainer: null,
        listContainer: null,
        minimapContainer: null,
        summaryContainer: null,
        lastUpdatedInfo: null,
        saveButton: null,
    };


    // =================================================================================
    // --- 2. CONFIGURACIÓN Y PLANTILLAS ---
    // =================================================================================
    const RENDER_CONFIG = {
        SHAPE_SIZE: 50,
        NODE_WIDTH: 350,
        NODE_HEIGHT: 60,
        H_SPACING: 80,
        V_SPACING: 60,
        STROKE_COLOR: '#475569',
        REJECTION_STROKE_COLOR: '#dc2626',
        DECISION_STROKE_COLOR: '#64748b',
        TRANSPORT_STROKE_COLOR: '#0ea5e9',
        FONT_COLOR: '#1e293b',
        FONT_SIZE: 12,
        NUMBER_FONT_COLOR: '#0c4a6e',
        NUMBER_FONT_SIZE: 13,
        TEXT_OFFSET_X: 25,
        CRITICAL_CHAR_COLOR: '#be123c',
        JOIN_NODE_RADIUS: 8,
        REPROCESS_LOOP_OFFSET: 40,
        TRANSPORT_AREA_WIDTH: 200,
        TRANSPORT_LINE_INCREMENT: 20,
    };

    const processTypes = {
        operation: { label: 'Operación', color: '#e0f2fe', shape: 'oval', isStep: false, description: 'Representa una transformación o tarea principal en el proceso.' },
        inspection: { label: 'Inspección', color: '#ccfbf1', shape: 'square', isStep: true, description: 'Indica un punto de control o verificación de calidad.' },
        decision: { label: 'Decisión', color: '#ede9fe', shape: 'diamond', isStep: true, description: 'Muestra un punto donde el flujo se divide según una condición.' },
        transport: { label: 'Transporte', color: '#dcfce7', shape: 'circle', isStep: true, description: 'Simboliza el movimiento de materiales o información.' },
        storage: { label: 'Almacenamiento', color: '#e2e8f0', shape: 'triangle_down', isStep: true, description: 'Representa una espera o almacenamiento de materiales.' },
        scrap: { label: 'Scrap', color: '#fee2e2', shape: 'scrap', isStep: false, isTerminal: true, description: 'Indica el descarte de material o un producto no conforme.' },
        reprocess: { label: 'Reproceso', color: '#fff7ed', shape: 'oval', isStep: false, description: 'Representa una operación para corregir un producto no conforme.' },
        unir: { label: 'Unir Ramas', color: '#e2e8f0', shape: 'join_dot', isStep: true, description: 'Punto de convergencia donde dos o más ramas del proceso se unen para continuar como un único flujo. Asegura la sincronización del proceso.' },
    };

    const templates = {
        styles: () => `
            <style>
                .sortable-ghost { background: #dbeafe; opacity: 0.5; }
                .drop-zone.drag-over { border-color: #3b82f6; background-color: #eff6ff; }
                .animate-pulse-once { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1); }
                @keyframes pulse {
                    0%, 100% { background-color: white; }
                    50% { background-color: #dbeafe; }
                }
                .process-item-wrapper.highlighted .process-item {
                    background-color: #eff6ff !important;
                    outline: 2px solid #3b82f6;
                }
                .svg-node.highlighted > g > *:not(text):not(.cc-indicator) {
                    stroke: #2563eb !important;
                    stroke-width: 3px !important;
                }
                .linking-mode .process-item-wrapper { cursor: crosshair; }
                .linking-mode .process-item-wrapper:hover .process-item { background-color: #f0f9ff; }
                .linking-source .process-item { background-color: #dbeafe !important; border-color: #3b82f6 !important; }
                .linking-mode .process-item-wrapper.invalid-target { cursor: not-allowed; }
                .linking-mode .process-item-wrapper.invalid-target .process-item { background-color: #fee2e2; border-color: #ef4444; }

                .header-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .header-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
                }
            </style>
        `,

        initialView: () => `
            <div class="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-md p-10 text-center animate-fade-in-up">
                <i data-lucide="git-branch-plus" class="h-24 w-24 text-gray-300 mb-6"></i>
                <h3 class="text-2xl font-bold">Flujograma de Procesos</h3>
                <p class="text-gray-500 mt-2 mb-8 max-w-lg">Seleccione un producto para comenzar a diseñar su flujograma.</p>
                <button data-action="open-product-search-flowchart" class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-lg">
                    <i data-lucide="search" class="inline-block mr-2 -mt-1"></i>Seleccionar Producto
                </button>
            </div>`,

        editorLayout: (producto, clienteNombre, isLocked, lockedBy) => `
            ${templates.styles()}
            <div class="flex flex-col h-full max-h-screen animate-fade-in-up">
                <div id="flowchart-header" class="flex-shrink-0 bg-white rounded-t-xl p-4 border-b grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
                     <div class="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="text" id="flowchart-organizacion" name="flowchart-organizacion" class="header-input bg-slate-100" readonly>
                        <div class="relative">
                            <input type="text" id="flowchart-proyecto" name="flowchart-proyecto" class="header-input" placeholder="Proyecto">
                            <div class="absolute inset-y-0 right-0 flex items-center">
                                <button class="p-2 text-gray-500 hover:text-gray-700"><i data-lucide="search" class="h-4 w-4"></i></button>
                                <button class="p-2 text-gray-500 hover:text-gray-700"><i data-lucide="x" class="h-4 w-4"></i></button>
                            </div>
                        </div>
                        <input type="text" id="flowchart-docId" name="flowchart-docId" class="header-input" placeholder="Nro. de Documento">
                        <input type="text" id="flowchart-fecha_inicio" name="flowchart-fecha_inicio" class="header-input" placeholder="Fecha de Inicio" onfocus="(this.type='date')" onblur="(this.type='text')">
                        <input type="text" id="flowchart-fecha_ultima_revision" name="flowchart-fecha_ultima_revision" class="header-input" placeholder="Fecha de Última Revisión" onfocus="(this.type='date')" onblur="(this.type='text')">
                        <input type="text" id="flowchart-responsable_elaboracion" name="flowchart-responsable_elaboracion" class="header-input" placeholder="Responsable de Elaboración">
                        <input type="text" id="flowchart-cliente" name="flowchart-cliente" class="header-input bg-slate-100" value="${clienteNombre}" readonly>
                        <input type="text" id="flowchart-locacion_planta" name="flowchart-locacion_planta" class="header-input bg-slate-100" readonly>
                    </div>
                </div>
                <div class="flex-shrink-0 bg-white p-3 border-b flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-slate-700">Flujograma para: <span class="text-blue-600">${producto.descripcion}</span></h3>
                        <p id="last-updated-info" class="text-xs text-slate-500 mt-1"></p>
                    </div>
                    <div id="editor-actions" class="flex items-center space-x-2">
                         ${isLocked ? `<span class="text-sm font-semibold text-orange-600 flex items-center"><i data-lucide="lock" class="h-4 w-4 mr-2"></i>Editando por ${lockedBy}</span>` : `
                        <button id="save-flowchart-btn" data-action="save-process-order" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center text-sm transition-colors duration-300 w-32 justify-center"></button>
                        <button data-action="show-history" class="bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 font-semibold flex items-center text-sm"><i data-lucide="history" class="mr-2 h-4 w-4"></i>Historial</button>
                        <button data-action="clone-flowchart" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-semibold flex items-center text-sm"><i data-lucide="copy" class="mr-2 h-4 w-4"></i>Clonar</button>
                        `}
                        <button data-action="export-flowchart-pdf" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold flex items-center text-sm"><i data-lucide="file-text" class="mr-2 h-4 w-4"></i>PDF</button>
                         <button data-action="back-to-flowchart-selection" class="bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600 font-semibold flex items-center text-sm">
                            <i data-lucide="arrow-left" class="mr-2 h-4 w-4"></i>Volver
                        </button>
                    </div>
                </div>
                <div class="flex-grow p-8 bg-slate-50 overflow-hidden flex gap-8">
                    <div id="editor-panel" class="w-2/3 flex-grow bg-white p-6 rounded-xl shadow-md flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center mb-4 flex-shrink-0">
                             <h2 class="text-xl font-bold text-slate-800">Secuencia de Procesos</h2>
                             <div id="linking-mode-indicator" class="hidden text-sm font-semibold text-sky-600 bg-sky-100 px-3 py-1 rounded-full animate-fade-in"></div>
                        </div>
                        <div id="process-list-container" class="flex-grow overflow-y-auto pr-2 custom-scrollbar"></div>
                    </div>
                    <div id="minimap-panel" class="w-1/3 flex-shrink-0 bg-white p-4 rounded-xl shadow-md flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 class="text-lg font-bold text-slate-800">Previsualización</h3>
                            <button data-action="reset-view" class="p-1 rounded-md hover:bg-slate-200 text-slate-500" title="Resetear Vista">
                                <i data-lucide="maximize" class="h-4 w-4"></i>
                            </button>
                        </div>
                        <div id="minimap-container" class="flex-grow border rounded-lg bg-slate-50/50 flex items-start justify-start overflow-auto cursor-grab"></div>
                        <div id="summary-container" class="flex-shrink-0 pt-3"></div>
                    </div>
                </div>
            </div>`,

        processList: (processes, pathPrefix = '', allOperations = []) => `
            <ul class="sortable-list space-y-2" ${pathPrefix ? `data-path="${pathPrefix}"` : ''}>
                ${processes.map(process => templates.processItem(process, allOperations)).join('')}
            </ul>
            ${(processes.length === 0) ? templates.emptyBranchPlaceholder() : ''}
            ${templates.addButtons(pathPrefix)}
        `,
        
        emptyBranchPlaceholder: () => `<div class="text-center text-xs text-slate-400 py-4 italic">Esta rama está vacía</div>`,

        processItem: (process, allOperations) => {
            const type = process.type || 'operation';
            const isInvalid = !process.isValid;
            const isOperation = type === 'operation';
            const isDecision = type === 'decision';
            const isInspection = type === 'inspection' || (isOperation && process.isInspection);
            const hasTerminalError = process.hasTerminalError;
            const itemBg = isOperation && process.isInspection ? 'bg-teal-50/50' : 'bg-white';
            const transportLinks = state.transportFlows.filter(f => f.fromId === process.id);

            return `
            <li class="process-item-wrapper" data-id="${process.id}" id="process-item-${process.id}">
                <div class="process-item p-3 ${itemBg} border rounded-lg shadow-sm ${isInvalid ? 'bg-gray-100' : ''} ${hasTerminalError ? 'border-red-500 border-2' : ''}" 
                     title="${hasTerminalError ? 'Error: Un paso terminal no puede tener pasos siguientes en la misma rama.' : ''}">
                    <div class="flex items-start">
                        <i data-lucide="grip-vertical" class="h-5 w-5 text-slate-400 mr-3 cursor-grab handle flex-shrink-0 mt-2"></i>
                        <div class="flex-grow">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center flex-grow min-w-0">
                                    <div class="w-40 mr-3 flex-shrink-0 font-semibold text-sm" style="color: ${processTypes[type].color.replace('e', '5').replace('f', '9')}">${processTypes[type].label}</div>
                                    <input type="text" data-action="edit-name" data-id="${process.id}" name="process-name-${process.id}" value="${process.name}" class="process-name-input font-medium ${isInvalid ? 'text-gray-500 italic' : 'text-slate-700'} w-full bg-transparent border-0 p-0 focus:ring-0 focus:bg-slate-100 rounded-sm" readonly>
                                    ${isOperation && process.isInspection ? '<i data-lucide="shield-check" class="h-4 w-4 text-teal-500 ml-2 flex-shrink-0" title="Operación con inspección"></i>' : ''}
                                    ${hasTerminalError ? '<i data-lucide="alert-triangle" class="h-4 w-4 text-red-500 ml-2 flex-shrink-0"></i>' : ''}
                                </div>
                                <div class="flex items-center flex-shrink-0 ml-3">
                                    ${isOperation ? `
                                    <button data-action="start-transport-linking" data-id="${process.id}" class="p-1 rounded-md hover:bg-sky-100 text-sky-600" title="Agregar transporte desde esta operación">
                                        <i data-lucide="link" class="h-4 w-4"></i>
                                    </button>
                                    <label class="flex items-center text-sm mx-3 cursor-pointer" title="Marcar como punto de inspección">
                                        <input type="checkbox" data-action="toggle-op-inspection" data-id="${process.id}" name="op-inspection-${process.id}" class="h-4 w-4 mr-1" ${process.isInspection ? 'checked' : ''}>
                                        Inspección
                                    </label>
                                    <label class="flex items-center text-sm mr-3 cursor-pointer" title="Marcar como Característica Crítica">
                                        <input type="checkbox" data-action="toggle-critical" data-id="${process.id}" name="critical-char-${process.id}" class="h-4 w-4 mr-1" ${process.isCritical ? 'checked' : ''}>
                                        CC
                                    </label>
                                    ` : ''}
                                    <button data-action="remove-process" data-id="${process.id}" class="p-1 rounded-md hover:bg-red-100 text-red-500">
                                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${ isInspection ? `
                    <div class="rejection-branch mt-2 ml-6 pl-4 border-l-2">
                        <div class="flex items-center justify-between bg-red-50 p-2 rounded-md">
                            <div class="branch-label text-sm font-bold text-red-600">DISPOSICIÓN NOK:</div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <select data-action="set-rejection-type" data-id="${process.id}" name="rejection-type-${process.id}" class="text-xs border-gray-300 rounded-md p-1 bg-white">
                                    <option value="">Seleccionar...</option>
                                    <option value="scrap" ${process.rejectionType === 'scrap' ? 'selected' : ''}>Scrap</option>
                                    <option value="reprocess" ${process.rejectionType === 'reprocess' ? 'selected' : ''}>Reproceso</option>
                                </select>
                                ${process.rejectionType === 'reprocess' ? `
                                    <select data-action="set-reprocess-target" data-id="${process.id}" name="reprocess-target-${process.id}" class="text-xs border-gray-300 rounded-md p-1 bg-white">
                                        <option value="">Volver a...</option>
                                        ${allOperations.map(step => `<option value="${step.id}" ${process.reprocessTargetId === step.id ? 'selected' : ''}>${step.opNumber || ''} - ${step.name}</option>`).join('')}
                                    </select>
                                    <input type="text" data-action="edit-reprocess-label" data-id="${process.id}" name="reprocess-label-${process.id}" value="${process.reprocessLabel || 'Reproceso'}" class="reprocess-label-input text-xs border-gray-300 rounded-md p-1 bg-white flex-grow" placeholder="Descripción del reproceso..." readonly>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    ${isDecision ? `
                    <div class="decision-branches mt-2 ml-6 pl-4 border-l-2">
                        <div class="branch-yes mt-2">
                            <div class="branch-label text-sm font-bold text-green-600 mb-2 p-1 bg-green-50 rounded-md">RAMA: SÍ</div>
                            <div class="drop-zone bg-green-50/50 border-2 border-dashed border-green-200 rounded-md p-2 min-h-[50px]">
                                ${templates.processList(process.children?.yes || [], `${process.id}.yes`, allOperations)}
                            </div>
                        </div>
                        <div class="branch-no mt-4">
                            <div class="branch-label text-sm font-bold text-red-600 mb-2 p-1 bg-red-50 rounded-md">RAMA: NO</div>
                            <div class="drop-zone bg-red-50/50 border-2 border-dashed border-red-200 rounded-md p-2 min-h-[50px]">
                                ${templates.processList(process.children?.no || [], `${process.id}.no`, allOperations)}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    ${transportLinks.length > 0 ? `
                    <div class="transport-links mt-2 ml-6 pl-4 border-l-2 border-sky-200">
                        ${transportLinks.map(link => {
                            return `
                            <div class="flex items-center justify-between bg-sky-50 p-2 rounded-md mt-1">
                                <div class="text-xs font-semibold text-sky-700 flex items-center flex-grow">
                                    <i data-lucide="truck" class="h-4 w-4 mr-2 flex-shrink-0"></i>
                                    <input type="text" data-action="edit-transport-label" data-link-id="${link.id}" name="transport-label-${link.id}" value="${link.label}" class="transport-label-input bg-transparent border-0 p-0 focus:ring-0 focus:bg-sky-100 rounded-sm w-full" readonly>
                                </div>
                                <button data-action="remove-transport" data-link-id="${link.id}" class="p-1 rounded-md hover:bg-red-100 text-red-500 ml-2">
                                    <i data-lucide="x" class="h-4 w-4"></i>
                                </button>
                            </div>
                            `}).join('')}
                    </div>
                    ` : ''}
                </div>
            </li>`;
        },

        addButtons: (path) => `
            <li class="mt-2">
                <button data-action="add-to-branch" data-path="${path || ''}" class="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition">
                    <i data-lucide="plus" class="h-5 w-5"></i>
                    <span class="font-semibold text-sm">Agregar Proceso o Paso</span>
                </button>
            </li>
        `,
        
        summary: (summaryData) => `
            <div>
                <h4 class="text-sm font-bold text-slate-600 mb-2">Resumen de Símbolos</h4>
                <div class="grid grid-cols-3 gap-2 text-xs">
                    ${Object.entries(summaryData).map(([key, count]) => {
                        const typeInfo = processTypes[key];
                        if (!typeInfo) return '';
                        return `
                        <div class="flex items-center bg-slate-100 p-1 rounded-md">
                            <span class="font-bold text-slate-800 mr-2">${count}</span>
                            <span class="text-slate-600">${typeInfo.label}</span>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `,

        loadingState: (message) => `<div class="text-center p-8"><div class="loading-spinner mx-auto"></div><p class="mt-4 text-slate-500">${message}</p></div>`,
        
        errorState: (message) => `<p class="text-red-500 text-center p-4">${message}</p>`,
        
        svgContainer: (content, defs, overrideViewBox = null) => {
            const viewBox = overrideViewBox || state.minimap.viewBox;
            return `
            <svg width="100%" height="100%" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
                <defs>
                    ${defs}
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${RENDER_CONFIG.STROKE_COLOR}"></path>
                    </marker>
                    <marker id="arrowhead-decision" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${RENDER_CONFIG.DECISION_STROKE_COLOR}"></path>
                    </marker>
                    <marker id="arrowhead-rejection" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${RENDER_CONFIG.REJECTION_STROKE_COLOR}"></path>
                    </marker>
                    <marker id="arrowhead-reprocess" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c"></path>
                    </marker>
                     <marker id="arrowhead-transport" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${RENDER_CONFIG.TRANSPORT_STROKE_COLOR}"></path>
                    </marker>
                    <filter id="dropshadow" height="130%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> 
                      <feOffset dx="2" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2"/>
                      </feComponentTransfer>
                      <feMerge> 
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/> 
                      </feMerge>
                    </filter>
                </defs>
                ${content}
            </svg>`;
        },

        node: (node, isExporting = false, isReprocessTarget = false) => {
            const typeInfo = processTypes[node.type || 'operation'];
            const { x, y } = node.pos;
            const S = RENDER_CONFIG.SHAPE_SIZE;
            const centerX = x + S / 2;
            const centerY = y + S / 2;
            let shapeSvg = '';
            const fill = `url(#grad-${node.type})`;

            if (node.type === 'operation' && node.isInspection) {
                shapeSvg += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="url(#grad-inspection)" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
            }

            switch(typeInfo.shape) {
                case 'square':
                    shapeSvg += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    break;
                case 'diamond':
                    shapeSvg += `<path d="M${centerX},${y} L${x+S},${centerY} L${centerX},${y+S} L${x},${centerY} Z" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    break;
                case 'join_dot':
                    shapeSvg += `<circle cx="${centerX}" cy="${centerY}" r="${RENDER_CONFIG.JOIN_NODE_RADIUS}" fill="${RENDER_CONFIG.STROKE_COLOR}" />`;
                    break;
                case 'triangle_down':
                    shapeSvg += `<path d="M${x},${y} L${x+S},${y} L${centerX},${y+S} Z" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    break;
                case 'scrap':
                    const inset = S * 0.2;
                    shapeSvg += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    shapeSvg += `<path d="M${x+inset},${y+inset} L${x+S-inset},${y+S-inset} M${x+S-inset},${y+inset} L${x+inset},${y+S-inset}" stroke="${RENDER_CONFIG.REJECTION_STROKE_COLOR}" stroke-width="2.5" />`;
                    break;
                case 'reprocess':
                    shapeSvg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${S / 2}" ry="${S / 3}" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    break;
                case 'oval':
                    shapeSvg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${S / 2}" ry="${S / 3}" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
                    break;
                default: // circle for transport
                    const circleRadius = (node.type === 'operation' && node.isInspection) ? S / 2.5 : S / 2;
                    shapeSvg += `<circle cx="${centerX}" cy="${centerY}" r="${circleRadius}" fill="${fill}" stroke="${RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;
            }

            const numberSvg = (node.opNumber)
                ? `<text x="${centerX}" y="${centerY}" font-size="${RENDER_CONFIG.NUMBER_FONT_SIZE}" font-weight="bold" fill="${RENDER_CONFIG.NUMBER_FONT_COLOR}" text-anchor="middle" dominant-baseline="central">${node.opNumber}</text>`
                : '';
            
            const criticalCharSvg = node.isCritical
                ? `<g class="cc-indicator">
                     <circle cx="${x+S-8}" cy="${y+8}" r="8" fill="${RENDER_CONFIG.CRITICAL_CHAR_COLOR}" />
                     <text x="${x+S-8}" y="${y+8}" font-size="9" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">CC</text>
                   </g>`
                : '';

            const textToRender = node.name || '';
            const words = textToRender.split(' ');
            let lines = [];
            let currentLine = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                if (currentLine.length + words[i].length < 30) {
                    currentLine += ` ${words[i]}`;
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);

            const lineHeight = RENDER_CONFIG.FONT_SIZE * 1.2;
            
            let textAnchor = 'start';
            let textX = x + S + RENDER_CONFIG.TEXT_OFFSET_X;
            let textYStart = centerY - ((lines.length - 1) * lineHeight / 2);
            let dominantBaseline = 'central';

            if (node.type === 'decision' || isReprocessTarget) {
                textAnchor = 'middle';
                textX = centerX;
                textYStart = y - 12;
                dominantBaseline = 'auto';
            } else if (node.branch === 'yes') {
                textAnchor = 'end';
                textX = x - RENDER_CONFIG.TEXT_OFFSET_X;
            }
            
            const textSvg = lines.map((line, i) => 
                `<tspan x="${textX}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`
            ).join('');
            
            const filterAttr = isExporting ? '' : 'filter="url(#dropshadow)"';

            return `<g class="svg-node" data-id="${node.id}" ${filterAttr}>
                ${shapeSvg}
                ${numberSvg}
                ${criticalCharSvg}
                ${node.type !== 'unir' ? `
                <text y="${textYStart}" font-size="${RENDER_CONFIG.FONT_SIZE}" fill="${RENDER_CONFIG.FONT_COLOR}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">
                    ${textSvg}
                </text>
                ` : ''}
            </g>`;
        },

        connector: (pathData, label = null, style = {}) => {
            let labelSvg = '';
            if (label) {
                const textWidth = label.text.length * 6;
                const textHeight = 12;
                const bgRect = `<rect x="${label.x - (label.anchor === 'end' ? textWidth + 4 : textWidth / 2 + 2)}" y="${label.y - textHeight / 2 - 2}" width="${textWidth + 4}" height="${textHeight + 4}" fill="white" rx="2" />`;
                const text = `<text x="${label.x}" y="${label.y}" font-size="11" font-weight="bold" fill="${label.color}" text-anchor="${label.anchor || 'middle'}" dominant-baseline="central">${label.text}</text>`;
                labelSvg = bgRect + text;
            }

            const strokeColor = style.stroke || RENDER_CONFIG.STROKE_COLOR;
            const strokeWidth = style.strokeWidth || 1.5;
            const marker = style.marker || 'url(#arrowhead)';
            const dashArray = style.strokeDasharray || '';

            return `<g>
                <path d="${pathData}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" marker-end="${marker}" stroke-dasharray="${dashArray}"/>
                ${labelSvg}
            </g>`;
        },
        
        joinNode: (cx, cy) => `<circle cx="${centerX}" cy="${centerY}" r="${RENDER_CONFIG.JOIN_NODE_RADIUS}" fill="${RENDER_CONFIG.STROKE_COLOR}" />`,

        addStepModal: (typeInfo) => `
            <div id="add-step-modal" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[1055] animate-fade-in">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-scale-in">
                    <div class="p-5 border-b flex justify-between items-center">
                        <h2 class="text-xl font-bold text-slate-800">Agregar Paso: ${typeInfo.label}</h2>
                        <button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button>
                    </div>
                    <div class="p-5">
                        <label for="step-name-input" class="block text-sm font-medium text-gray-700 mb-2">Descripción del Paso</label>
                        <input type="text" id="step-name-input" placeholder="Ej: Inspeccionar soldadura..." class="w-full px-4 py-2 border rounded-lg" value="${typeInfo.label}">
                    </div>
                    <div class="p-5 border-t bg-slate-50 flex justify-end gap-3">
                        <button data-action="close-modal" class="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 font-semibold">Cancelar</button>
                        <button id="save-step-btn" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold">Agregar</button>
                    </div>
                </div>
            </div>`,
    };

    // --- 3. INICIALIZACIÓN Y LÓGICA PRINCIPAL ---

    function init(dependencies) {
        appState = dependencies.appState;
        dom = dependencies.dom;
        uiService = dependencies.uiService;
        dataService = dependencies.dataService;
        switchView = dependencies.switchView;
        db = dependencies.db;
        firestore = dependencies.firestore;
        COLLECTIONS = dependencies.COLLECTIONS;
        isInitialized = true;
    }

    function runLogic(container, payload = {}) {
        ensureInitialized();
        cleanupModuleState();
        
        if (payload.productId) {
            const producto = appState.collectionsById[COLLECTIONS.PRODUCTOS]?.get(payload.productId);
            if (producto) {
                appState.flujogramaActivo = producto;
                renderEditor(container, producto);
            } else {
                uiService.showToast(`Error: No se encontró el producto con ID ${payload.productId}.`, 'error');
                renderInitialView(container);
            }
        } else {
            appState.flujogramaActivo = null;
            renderInitialView(container);
        }

        return () => {
            cleanupModuleState();
        };
    }

    function ensureInitialized() {
        if (!isInitialized) {
            const errorMessage = "Módulo de Flujograma no inicializado.";
            console.error(errorMessage);
            if (uiService.showToast) uiService.showToast(errorMessage, 'error');
            else alert(errorMessage);
            throw new Error(errorMessage);
        }
    }

    function cleanupModuleState() {
        if (appState.currentFlowchartLock) {
            releaseFlowchartLock(appState.currentFlowchartLock.productId);
            appState.currentFlowchartLock = null;
        }
        if (unsubscribeFromLock) {
            unsubscribeFromLock();
            unsubscribeFromLock = null;
        }
        sortableInstances.forEach(s => s.destroy());
        sortableInstances = [];
        document.removeEventListener('keydown', handleGlobalKeyDown);
    }


    // =================================================================================
    // --- 4. MOTOR DE RENDERIZADO SVG (LÓGICA DE LAYOUT) ---
    // =================================================================================

    function measureBranch(processList, memo = new Map()) {
        if (!processList || processList.length === 0) {
            return { width: 0, height: 0 };
        }

        const V_GAP = RENDER_CONFIG.NODE_HEIGHT + RENDER_CONFIG.V_SPACING;
        const H_GAP = RENDER_CONFIG.H_SPACING;
        const NODE_WIDTH = RENDER_CONFIG.NODE_WIDTH;

        let totalHeight = 0;
        let maxWidth = 0;

        for (let i = 0; i < processList.length; i++) {
            const process = processList[i];
            const memoKey = process.id;
            if (memo.has(memoKey)) {
                 const cached = memo.get(memoKey);
                 totalHeight += cached.height;
                 maxWidth = Math.max(maxWidth, cached.width);
                 continue;
            }

            let nodeHeight = V_GAP;
            let nodeWidth = NODE_WIDTH;

            if (process.type === 'decision') {
                const yesDims = measureBranch(process.children?.yes || [], memo);
                const noDims = measureBranch(process.children?.no || [], memo);
                
                nodeWidth = yesDims.width + noDims.width + H_GAP;
                if (yesDims.width === 0 && noDims.width === 0) {
                    nodeWidth = NODE_WIDTH;
                }

                const branchHeight = Math.max(yesDims.height, noDims.height);
                nodeHeight += branchHeight;
                
                const nextNode = processList[i + 1];
                if (nextNode && nextNode.type === 'unir') {
                    nodeHeight += V_GAP;
                }

            } else if (process.type !== 'unir') {
                 const isInspection = process.type === 'inspection' || (process.type === 'operation' && process.isInspection);
                 if (isInspection && process.rejectionType) {
                    nodeWidth += H_GAP + NODE_WIDTH;
                 }
            }
            
            memo.set(memoKey, { width: nodeWidth, height: nodeHeight });
            totalHeight += nodeHeight;
            maxWidth = Math.max(maxWidth, nodeWidth);
        }

        return { width: maxWidth, height: totalHeight };
    }

    function positionNodes(processList, centerX, startY, nodes, connectors, memo, branch = 'main') {
        let currentY = startY;
        let lastNode = null;
        const V_GAP = RENDER_CONFIG.NODE_HEIGHT + RENDER_CONFIG.V_SPACING;
        const H_GAP = RENDER_CONFIG.H_SPACING;
        const S = RENDER_CONFIG.SHAPE_SIZE;

        for (let i = 0; i < processList.length; i++) {
            const process = processList[i];
            process.branch = branch;
            
            if (process.type === 'unir') {
                continue;
            }

            const nodeX = centerX - S / 2;

            if (lastNode) {
                connectors.push({ from: lastNode.id, to: process.id, type: 'standard' });
            }

            if (process.type === 'decision') {
                nodes.set(process.id, { ...process, pos: { x: nodeX, y: currentY } });
                
                const yesDims = measureBranch(process.children?.yes || [], memo);
                const noDims = measureBranch(process.children?.no || [], memo);
                
                const noBranchCenterX = centerX + (yesDims.width / 2) + (yesDims.width > 0 ? H_GAP / 2 : 0);
                const yesBranchCenterX = centerX - (noDims.width / 2) - (noDims.width > 0 ? H_GAP / 2 : 0);

                const branchStartY = currentY + V_GAP;
                
                const branchHeightDiff = Math.abs(yesDims.height - noDims.height);
                const yesStartY = yesDims.height < noDims.height ? branchStartY + branchHeightDiff : branchStartY;
                const noStartY = noDims.height < yesDims.height ? branchStartY + branchHeightDiff : branchStartY;

                const noBranchEnd = positionNodes(process.children.no || [], noBranchCenterX, noStartY, nodes, connectors, memo, 'no');
                const yesBranchEnd = positionNodes(process.children.yes || [], yesBranchCenterX, yesStartY, nodes, connectors, memo, 'yes');

                if (yesBranchEnd.firstId) connectors.push({ from: process.id, to: yesBranchEnd.firstId, label: 'SÍ' });
                if (noBranchEnd.firstId) connectors.push({ from: process.id, to: noBranchEnd.firstId, label: 'NO' });

                const branchHeight = Math.max(yesDims.height, noDims.height);
                const endOfBranchesY = currentY + V_GAP + branchHeight - V_GAP;

                const nextNode = processList[i + 1];
                if (nextNode && nextNode.type === 'unir') {
                    const joinY = endOfBranchesY + V_GAP;
                    nodes.set(nextNode.id, { ...nextNode, pos: { x: centerX - S / 2, y: joinY } });
                    
                    if (yesBranchEnd.lastId) connectors.push({ from: yesBranchEnd.lastId, to: nextNode.id, type: 'join' });
                    if (noBranchEnd.lastId) connectors.push({ from: noBranchEnd.lastId, to: nextNode.id, type: 'join' });

                    lastNode = nextNode;
                    currentY = joinY + V_GAP;
                    i++;
                } else {
                    lastNode = null; 
                    currentY = endOfBranchesY + V_GAP;
                }

            } else {
                nodes.set(process.id, { ...process, pos: { x: nodeX, y: currentY } });
                lastNode = process;
                
                const isInspection = process.type === 'inspection' || (process.type === 'operation' && process.isInspection);
                if (isInspection && process.rejectionType) {
                    const rejectionNodeId = `rejection_${process.id}`;
                    const rejectionX = centerX + RENDER_CONFIG.NODE_WIDTH / 2 + H_GAP;
                    nodes.set(rejectionNodeId, {
                        id: rejectionNodeId, name: processTypes[process.rejectionType].label, type: process.rejectionType,
                        pos: { x: rejectionX, y: currentY }
                    });
                    connectors.push({ from: process.id, to: rejectionNodeId, label: 'NOK' });

                    if (process.rejectionType === 'reprocess' && process.reprocessTargetId) {
                        connectors.push({ from: rejectionNodeId, to: process.reprocessTargetId, type: 'reprocess' });
                    }
                }
                currentY += V_GAP;
            }
        }
        
        return {
            firstId: processList[0]?.id,
            lastId: lastNode?.id
        };
    }

    function calculateLayout(processes) {
        const nodes = new Map();
        const connectors = [];
        const memo = new Map();

        const totalDims = measureBranch(processes, memo);
        const initialCenterX = totalDims.width / 2;
        positionNodes(processes, initialCenterX, RENDER_CONFIG.SHAPE_SIZE, nodes, connectors, memo);

        const allNodes = Array.from(nodes.values());
        if (allNodes.length === 0) {
            return { nodes, connectors, width: 300, height: 200 };
        }

        const transportArea = state.transportFlows.length > 0 ? RENDER_CONFIG.TRANSPORT_AREA_WIDTH : 0;
        
        const minX = Math.min(...allNodes.map(n => n.pos.x));
        
        allNodes.forEach(n => {
            n.pos.x += -minX + transportArea + RENDER_CONFIG.SHAPE_SIZE;
        });

        const finalWidth = Math.max(...allNodes.map(n => n.pos.x + RENDER_CONFIG.NODE_WIDTH)) + RENDER_CONFIG.SHAPE_SIZE;
        const finalHeight = Math.max(...allNodes.map(n => n.pos.y + RENDER_CONFIG.NODE_HEIGHT)) + RENDER_CONFIG.SHAPE_SIZE;

        return { nodes, connectors, width: finalWidth, height: finalHeight };
    }


    function renderSvg(layout, overrideViewBox = null, isExporting = false) {
        const { nodes, connectors: connectorData } = layout;
        let svgElements = '';
        const S = RENDER_CONFIG.SHAPE_SIZE;

        let defs = Object.entries(processTypes).map(([key, {color}]) => {
            const lightColor = tinycolor(color).lighten(10).toString();
            return `<linearGradient id="grad-${key}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${lightColor};" /><stop offset="100%" style="stop-color:${color};" /></linearGradient>`;
        }).join('');

        const reprocessTargetIds = new Set();
        nodes.forEach(node => {
            if (node.rejectionType === 'reprocess' && node.reprocessTargetId) {
                reprocessTargetIds.add(node.reprocessTargetId);
            }
        });

        connectorData.forEach(conn => {
            const fromNode = nodes.get(conn.from);
            const toNode = nodes.get(conn.to);
            if (!fromNode || !toNode) return;

            let pathData = '', label, style = {};
            const fromCenterX = fromNode.pos.x + S / 2;
            const toCenterX = toNode.pos.x + S / 2;

            if (conn.type === 'reprocess') {
                const fromPoint = { x: fromNode.pos.x + S, y: fromNode.pos.y + S / 2 };
                const toPoint = { x: toNode.pos.x + S, y: toNode.pos.y + S / 2 };
                const offset = RENDER_CONFIG.REPROCESS_LOOP_OFFSET * 1.5;
                pathData = `M ${fromPoint.x} ${fromPoint.y} H ${fromPoint.x + offset} V ${toPoint.y} H ${toPoint.x}`;
                style = {
                    stroke: '#ea580c',
                    strokeDasharray: '4 2',
                    marker: 'url(#arrowhead-reprocess)'
                };
                const inspectionNode = nodes.get(fromNode.id.replace('rejection_', ''));
                if (inspectionNode && inspectionNode.reprocessLabel) {
                     label = { text: inspectionNode.reprocessLabel, x: fromPoint.x + offset, y: (fromPoint.y + toPoint.y) / 2, color: '#ea580c', anchor: 'end' };
                }
                svgElements += templates.connector(pathData, label, style);
                return;
            }

            if (fromNode.type === 'decision' && conn.type !== 'join') {
                const fromPointX = conn.label === 'SÍ' ? fromNode.pos.x : fromNode.pos.x + S;
                const fromPointY = fromNode.pos.y + S / 2;
                const toPoint = { x: toCenterX, y: toNode.pos.y };
                pathData = `M ${fromPointX} ${fromPointY} H ${toPoint.x} V ${toPoint.y}`;
                
                style = { stroke: RENDER_CONFIG.DECISION_STROKE_COLOR, strokeWidth: 1.2, marker: 'url(#arrowhead-decision)' };
                const labelX = toPoint.x;
                const labelY = fromPointY - 10;
                if (conn.label === 'SÍ') label = { text: 'SÍ', x: labelX, y: labelY, color: '#16a34a' };
                if (conn.label === 'NO') label = { text: 'NO', x: labelX, y: labelY, color: '#dc2626' };
                svgElements += templates.connector(pathData, label, style);
            } else if (conn.type === 'join') {
                const fromPointY = fromNode.pos.y + S;
                const toPointX = toNode.pos.x + (fromNode.branch === 'yes' ? RENDER_CONFIG.JOIN_NODE_RADIUS : S - RENDER_CONFIG.JOIN_NODE_RADIUS);
                const toPointY = toNode.pos.y + S / 2;
                pathData = `M ${fromCenterX} ${fromPointY} V ${toPointY} H ${toPointX}`;
                style = { stroke: RENDER_CONFIG.DECISION_STROKE_COLOR, strokeWidth: 1.2, marker: 'url(#arrowhead-decision)' };
                svgElements += templates.connector(pathData, label, style);
            } else if (conn.label === 'NOK') {
                const fromPoint = { x: fromNode.pos.x + S, y: fromNode.pos.y + S / 2 };
                const toPoint = { x: toNode.pos.x, y: toNode.pos.y + S/2 };
                const midX = (fromPoint.x + toPoint.x) / 2;
                const controlY = fromPoint.y - 30;
                pathData = `M ${fromPoint.x} ${fromPoint.y} Q ${midX} ${controlY}, ${toPoint.x} ${toPoint.y}`;
                label = { text: 'NOK', x: midX, y: controlY, color: '#dc2626' };
                style = { stroke: RENDER_CONFIG.REJECTION_STROKE_COLOR, strokeWidth: 2, marker: 'url(#arrowhead-rejection)' };
                svgElements += templates.connector(pathData, label, style);
            } else { // Standard
                let fromY = fromNode.pos.y;
                let toY = toNode.pos.y;

                const fromTypeInfo = processTypes[fromNode.type];
                if (fromTypeInfo && fromTypeInfo.shape === 'oval') {
                    fromY += S / 2 + S / 3; // Centro + radio vertical
                } else if (fromTypeInfo && fromTypeInfo.shape === 'circle') {
                    fromY += S; 
                } else {
                    fromY += S; 
                }

                const toTypeInfo = processTypes[toNode.type];
                if (toTypeInfo && toTypeInfo.shape === 'oval') {
                    toY = toNode.pos.y + S / 2 - S / 3;
                } else if (toTypeInfo && toTypeInfo.shape === 'circle') {
                    toY = toNode.pos.y;
                }
                
                if (!fromTypeInfo?.isTerminal) {
                    pathData = `M ${fromCenterX} ${fromY} V ${toY}`;
                    svgElements += templates.connector(pathData, label, style);
                }
            }
        });

        nodes.forEach(node => {
            svgElements += templates.node(node, isExporting, reprocessTargetIds.has(node.id));
        });

        const allNodesArray = Array.from(nodes.values());
        const minX = allNodesArray.length > 0 ? Math.min(...allNodesArray.map(n => n.pos.x)) : 0;
        
        state.transportFlows.forEach((flow, index) => {
            const fromNode = nodes.get(flow.fromId);
            const toNode = nodes.get(flow.toId);
            if (fromNode && toNode) {
                const fromPoint = { x: fromNode.pos.x, y: fromNode.pos.y + S / 2 };
                const toPoint = { x: toNode.pos.x, y: toNode.pos.y + S / 2 };
                
                const lineX = RENDER_CONFIG.TRANSPORT_AREA_WIDTH - RENDER_CONFIG.H_SPACING - (index * RENDER_CONFIG.TRANSPORT_LINE_INCREMENT);

                const pathData = `M ${fromPoint.x} ${fromPoint.y} H ${lineX} V ${toPoint.y} H ${toPoint.x}`;
                
                const label = { 
                    text: flow.label, 
                    x: lineX - 8, 
                    y: (fromPoint.y + toPoint.y) / 2, 
                    color: RENDER_CONFIG.TRANSPORT_STROKE_COLOR,
                    anchor: 'end'
                };
                
                const style = {
                    stroke: RENDER_CONFIG.TRANSPORT_STROKE_COLOR,
                    strokeDasharray: '5 3',
                    marker: 'url(#arrowhead-transport)'
                };
                svgElements += templates.connector(pathData, label, style);
            }
        });


        return templates.svgContainer(svgElements, defs, overrideViewBox);
    }

    const debouncedUpdateMinimap = debounce(updateMinimap, 250);

    function updateMinimap() {
        if (!ui.minimapContainer) return;

        if (state.processes.length === 0) {
            ui.minimapContainer.innerHTML = `<p class="text-slate-400 text-sm p-4 text-center">Añada procesos para ver la previsualización.</p>`;
            updateSummary();
            return;
        }
        try {
            const layout = calculateLayout(state.processes);
            
            if (state.minimap.viewBox.width === 0 || state.minimap.viewBox.height === 0 || state.hasUnsavedChanges) {
                state.minimap.viewBox = { x: 0, y: 0, width: layout.width, height: layout.height };
            }
            
            ui.minimapContainer.innerHTML = renderSvg(layout);
            bindHighlightEvents();
            updateSummary();
        } catch (error) {
            console.error("Error al renderizar SVG:", error);
            ui.minimapContainer.innerHTML = templates.errorState(`Error al renderizar la previsualización. Verifique la consola.`);
        }
    }


    // =================================================================================
    // --- 5. LÓGICA DE RENDERIZADO DE LA INTERFAZ ---
    // =================================================================================

    function renderInitialView(container) {
        appState.flujogramaActivo = null;
        container.innerHTML = templates.initialView();
        lucide.createIcons();
        container.querySelector('[data-action="open-product-search-flowchart"]').addEventListener('click', () => {
            // --- CORRECCIÓN ---
            // Se llama a la nueva función genérica del uiService.
            uiService.openSearchModal({
                collectionName: 'productos',
                title: 'Seleccionar Producto para Flujograma',
                onSelect: (product) => runLogic(container, { productId: product.docId })
            });
        });
    }

    async function renderEditor(container, producto) {
        try {
            const isLockedByOther = await acquireFlowchartLock(producto.docId);
            state.isLocked = !!isLockedByOther;
            state.lockedBy = isLockedByOther ? isLockedByOther.userEmail : '';

            const clienteNombre = appState.collectionsById[COLLECTIONS.CLIENTES].get(producto.clienteId)?.descripcion || producto.clienteId || 'N/A';
            container.innerHTML = templates.editorLayout(producto, clienteNombre, state.isLocked, state.lockedBy);
            
            cacheUIElements(container);
            bindEditorEvents(container, producto);
            await loadAndValidateData(producto);
            
            const lockRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, producto.docId);
            unsubscribeFromLock = firestore.onSnapshot(lockRef, (docSnap) => {
                const lockData = docSnap.data()?.lock;
                if (!lockData && state.isLocked) {
                    uiService.showToast('El flujograma ha sido liberado. Recargando...', 'success');
                    setTimeout(() => renderEditor(container, producto), 1500);
                }
            });

            lucide.createIcons();
        } catch (error) {
            console.error("Error fatal al renderizar el editor:", error);
            uiService.showToast("No se pudo cargar el editor.", "error");
            runLogic(container);
        }
    }

    async function loadAndValidateData(producto, versionData = null) {
        if (!ui.listContainer) return;
        ui.listContainer.innerHTML = templates.loadingState('Cargando y validando datos...');
        
        try {
            let dataToRender = versionData;
            if (!dataToRender) {
                const docRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, producto.docId);
                const docSnap = await firestore.getDoc(docRef);
                dataToRender = docSnap.exists() ? docSnap.data() : { processOrder: [], header: {} };
            }

            const { processOrder = [], header = {}, transportFlows = [], lastUpdated, updatedBy } = dataToRender;
            
            const defaultHeader = {
                organizacion: 'Barack Mercosul',
                locacion_planta: 'Los Arboles 842, Hurlingham, Buenos Aires, Argentina',
            };

            state.header = { ...defaultHeader, ...header };
            state.transportFlows = transportFlows || [];
            state.lastUpdated = lastUpdated;
            state.updatedBy = updatedBy;

            state.processes = await validateProcessesRecursively(processOrder);
            
            validateAndCleanTransportFlows();

            updateUIFromState();
            setUnsavedChanges(!!versionData);

        } catch (error) {
            console.error("Error al cargar datos:", error);
            uiService.showToast('Error al cargar datos del flujograma.', 'error');
            ui.listContainer.innerHTML = templates.errorState('No se pudieron cargar los procesos.');
        }
    }

    async function validateProcessesRecursively(processList) {
        if (!processList || processList.length === 0) return [];
        
        const allProcessIds = new Set();
        const idsToFetch = new Set();
        
        function collectIds(nodes) {
            if (!nodes) return;
            nodes.forEach(node => {
                allProcessIds.add(node.id);
                if (!node.isStep) {
                    idsToFetch.add(node.id);
                }
                if (node.children) {
                    collectIds(node.children.yes);
                    collectIds(node.children.no);
                }
            });
        }
        collectIds(processList);

        const fetchedProcesses = new Map();
        if (idsToFetch.size > 0) {
            const q = firestore.query(firestore.collection(db, COLLECTIONS.PROCESOS), firestore.where('id', 'in', Array.from(idsToFetch)));
            const snapshot = await firestore.getDocs(q);
            snapshot.docs.forEach(doc => fetchedProcesses.set(doc.data().id, doc.data()));
        }

        async function applyValidation(nodes) {
            if (!nodes) return [];
            const validationPromises = nodes.map(async (process) => {
                let validatedProc;
                if (process.isStep) {
                    validatedProc = { ...process, isValid: true };
                } else {
                    const data = fetchedProcesses.get(process.id);
                    validatedProc = data
                        ? { ...process, name: data.descripcion, opNumber: data.numero, isValid: true }
                        : { ...process, name: `[ELIMINADO] ${process.name || 'Proceso desconocido'}`, isValid: false };
                }
                
                validatedProc.isCritical = validatedProc.isCritical || false;
                validatedProc.isInspection = validatedProc.isInspection || false;
                
                if (validatedProc.reprocessTargetId && !allProcessIds.has(validatedProc.reprocessTargetId)) {
                    uiService.showToast(`Enlace de reproceso roto eliminado de "${validatedProc.name}".`, 'warning');
                    validatedProc.reprocessTargetId = null;
                    setUnsavedChanges(true);
                }

                if (validatedProc.children) {
                    validatedProc.children = {
                        yes: await applyValidation(validatedProc.children.yes || []),
                        no: await applyValidation(validatedProc.children.no || [])
                    };
                }
                return validatedProc;
            });
            return Promise.all(validationPromises);
        }

        return applyValidation(processList);
    }

    function updateUIFromState() {
        if (!ui.headerContainer || !ui.lastUpdatedInfo) return;
        
        Object.keys(state.header).forEach(key => {
            const input = ui.headerContainer.querySelector(`#flowchart-${key}`);
            if (input) input.value = state.header[key] || '';
        });
        
        if (state.lastUpdated && state.lastUpdated.toDate) {
            ui.lastUpdatedInfo.textContent = `Última mod.: ${state.lastUpdated.toDate().toLocaleString()} por ${state.updatedBy || 'desconocido'}`;
        } else {
            ui.lastUpdatedInfo.textContent = 'Aún no se ha guardado este flujograma.';
        }

        renderProcessList();
        debouncedUpdateMinimap();
        setUnsavedChanges(state.hasUnsavedChanges);
    }

    function renderProcessList() {
        if (!ui.listContainer) return;
        
        sortableInstances.forEach(s => s.destroy());
        sortableInstances = [];
        
        checkForTerminalErrors();

        const allOperations = getAllOperations();
        ui.listContainer.innerHTML = templates.processList(state.processes, '', allOperations);
        
        lucide.createIcons();
        
        rebindCoreListEvents();
    }

    function updateSummary() {
        if (!ui.summaryContainer) return;
        const summaryData = {};

        function countProcesses(processes) {
            if (!processes) return;
            processes.forEach(p => {
                const type = p.type || 'operation';
                summaryData[type] = (summaryData[type] || 0) + 1;
                if (p.children) {
                    countProcesses(p.children.yes);
                    countProcesses(p.children.no);
                }
                if (p.rejectionType) {
                     summaryData[p.rejectionType] = (summaryData[p.rejectionType] || 0) + 1;
                }
            });
        }
        countProcesses(state.processes);

        if (Object.keys(summaryData).length > 0) {
            ui.summaryContainer.innerHTML = templates.summary(summaryData);
        } else {
            ui.summaryContainer.innerHTML = '';
        }
    }


    // =================================================================================
    // --- 6. MANEJO DE EVENTOS ---
    // =================================================================================

    function cacheUIElements(container) {
        ui.headerContainer = container.querySelector('#flowchart-header');
        ui.actionsContainer = container.querySelector('#editor-actions');
        ui.listContainer = container.querySelector('#process-list-container');
        ui.minimapContainer = container.querySelector('#minimap-container');
        ui.summaryContainer = container.querySelector('#summary-container');
        ui.lastUpdatedInfo = container.querySelector('#last-updated-info');
        ui.saveButton = container.querySelector('#save-flowchart-btn');
    }

    function bindEditorEvents(container, producto) {
        if (!container || !ui.actionsContainer) return;

        container.querySelector('[data-action="back-to-flowchart-selection"]').onclick = () => {
            appState.flujogramaActivo = null;
            runLogic(container);
        };
        
        const exportPdfBtn = ui.actionsContainer.querySelector('[data-action="export-flowchart-pdf"]');
        if (exportPdfBtn) exportPdfBtn.onclick = () => exportFlowchart(producto, 'pdf');
        
        const cloneBtn = ui.actionsContainer.querySelector('[data-action="clone-flowchart"]');
        if(cloneBtn) cloneBtn.onclick = () => cloneFlowchart(producto);
        
        const historyBtn = ui.actionsContainer.querySelector('[data-action="show-history"]');
        if(historyBtn) historyBtn.onclick = () => showVersionHistory(producto);

        const resetViewBtn = container.querySelector('[data-action="reset-view"]');
        if(resetViewBtn) resetViewBtn.onclick = () => {
            state.minimap.viewBox.width = 0;
            state.minimap.viewBox.height = 0;
            updateMinimap();
        };

        if (!state.isLocked) {
            if (ui.saveButton) {
                ui.saveButton.onclick = () => saveProcessOrder(producto);
            }
            
            ui.headerContainer.querySelectorAll('.header-input').forEach(input => {
                input.oninput = (e) => {
                    state.header[e.target.id.replace('flowchart-', '')] = e.target.value;
                    setUnsavedChanges(true);
                };
            });
            
            document.addEventListener('keydown', handleGlobalKeyDown);
        }

        if (ui.minimapContainer) {
            ui.minimapContainer.addEventListener('wheel', handleMinimapZoom);
            ui.minimapContainer.addEventListener('mousedown', handleMinimapPanStart);
            ui.minimapContainer.addEventListener('mousemove', handleMinimapPanMove);
            ui.minimapContainer.addEventListener('mouseup', handleMinimapPanEnd);
            ui.minimapContainer.addEventListener('mouseleave', handleMinimapPanEnd);
        }
    }

    function rebindCoreListEvents() {
        if (!ui.listContainer) return;

        const oldContainer = ui.listContainer;
        const newContainer = oldContainer.cloneNode(true);
        
        oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        
        ui.listContainer = newContainer;
        
        bindListEvents();
    }


    function bindListEvents() {
        if (!ui.listContainer) return;

        // Inicializar Sortable.js
        ui.listContainer.querySelectorAll('.sortable-list').forEach(list => {
            const instance = new Sortable(list, {
                group: 'processes', 
                animation: 150, 
                handle: '.handle', 
                onEnd: handleDropEvent,
            });
            sortableInstances.push(instance);
        });

        // Delegación de eventos principal
        ui.listContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            
            if (button) {
                event.stopPropagation();
                const action = button.dataset.action;
                const id = button.dataset.id;
                const path = button.dataset.path;
                const linkId = button.dataset.linkId;
                
                const actions = {
                    'remove-process': () => removeProcess(id),
                    'add-to-branch': () => openAddMenu(button, path),
                    'remove-transport': () => removeTransportLink(linkId),
                    'start-transport-linking': () => startTransportLinking(id),
                };
                
                if (actions[action]) {
                    actions[action]();
                }
                return;
            }

            const wrapper = event.target.closest('.process-item-wrapper');
            if (state.linkingTransportState.isActive && wrapper) {
                handleTransportNodeClick(wrapper.dataset.id);
                return;
            }
        });

        // Eventos para feedback visual al enlazar
        ui.listContainer.addEventListener('mouseover', (event) => {
            if (!state.linkingTransportState.isActive) return;
            const wrapper = event.target.closest('.process-item-wrapper');
            if (wrapper) {
                const targetId = wrapper.dataset.id;
                const fromId = state.linkingTransportState.fromId;
                const toNodeResult = findNodeWithContainer(targetId);

                let isInvalid = true; 
                if (toNodeResult) {
                    const toNode = toNodeResult.node;
                    isInvalid = targetId === fromId || isNodeBefore(fromId, targetId) || toNode.type !== 'operation';
                }
                
                wrapper.classList.toggle('invalid-target', isInvalid);
            }
        });

        ui.listContainer.addEventListener('mouseout', (event) => {
            if (!state.linkingTransportState.isActive) return;
            const wrapper = event.target.closest('.process-item-wrapper');
            if (wrapper) {
                wrapper.classList.remove('invalid-target');
            }
        });


        // Otros eventos (change, dblclick, blur, keydown)
        ui.listContainer.addEventListener('change', (event) => {
            const target = event.target;
            const id = target.dataset.id;
            if (!id) return;

            if (target.matches('[data-action="toggle-critical"]')) {
                updateProcess(id, { isCritical: target.checked });
            } else if (target.matches('[data-action="toggle-op-inspection"]')) {
                const isChecked = target.checked;
                updateProcess(id, { isInspection: isChecked });

                const itemWrapper = document.getElementById(`process-item-${id}`);
                const processItem = itemWrapper?.querySelector('.process-item');
                const rejectionBranch = itemWrapper?.querySelector('.rejection-branch');
                
                if (isChecked) {
                    if (processItem && !rejectionBranch) {
                        const processData = findNodeWithContainer(id)?.node;
                        const allOperations = getAllOperations();
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = templates.processItem(processData, allOperations);
                        const newRejectionBranch = tempDiv.querySelector('.rejection-branch');
                        if (newRejectionBranch) {
                            processItem.appendChild(newRejectionBranch);
                            lucide.createIcons({ nodes: [newRejectionBranch] });
                        }
                    }
                } else {
                    if (rejectionBranch) {
                        rejectionBranch.remove();
                    }
                }
                if (processItem) {
                     processItem.classList.toggle('bg-teal-50/50', isChecked);
                }

            } else if (target.matches('[data-action="set-rejection-type"]')) {
                updateProcess(id, { rejectionType: target.value, reprocessTargetId: null });
                renderProcessList();
            } else if (target.matches('[data-action="set-reprocess-target"]')) {
                updateProcess(id, { reprocessTargetId: target.value });
            }
        });

        ui.listContainer.addEventListener('dblclick', (event) => {
            const input = event.target.closest('input[data-action="edit-name"], input[data-action="edit-transport-label"], input[data-action="edit-reprocess-label"]');
            if (input) {
                input.readOnly = false;
                input.focus();
                input.select();
            }
        });

        ui.listContainer.addEventListener('blur', (event) => {
            const nameInput = event.target.closest('input[data-action="edit-name"]');
            if (nameInput) {
                nameInput.readOnly = true;
                updateProcess(nameInput.dataset.id, { name: nameInput.value });
            }
            const transportInput = event.target.closest('input[data-action="edit-transport-label"]');
            if (transportInput) {
                transportInput.readOnly = true;
                updateTransportLink(transportInput.dataset.linkId, { label: transportInput.value });
            }
            const reprocessInput = event.target.closest('input[data-action="edit-reprocess-label"]');
            if (reprocessInput) {
                reprocessInput.readOnly = true;
                updateProcess(reprocessInput.dataset.id, { reprocessLabel: reprocessInput.value });
            }
        }, true);
        
        ui.listContainer.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const input = event.target.closest('input[data-action="edit-name"], input[data-action="edit-transport-label"], input[data-action="edit-reprocess-label"]');
                if (input) {
                    input.blur();
                }
            }
        });
    }


    function handleDropEvent(event) {
        const movedItemWrapper = event.item; 
        if (!movedItemWrapper) {
            console.error("No se pudo encontrar el wrapper del proceso movido.");
            return;
        }
        
        const movedItemId = movedItemWrapper.dataset.id;
        const toListElement = event.to;
        const fromListElement = event.from;
        const newIndex = event.newIndex;

        const fromPath = fromListElement.dataset.path;
        const toPath = toListElement.dataset.path;
        
        moveProcess(movedItemId, fromPath, toPath, newIndex);
    }

    function handleGlobalKeyDown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            if (ui.saveButton && !ui.saveButton.disabled) {
                ui.saveButton.click();
            }
        }
        if (event.key === 'Escape' && state.linkingTransportState.isActive) {
            cancelTransportLinking();
        }
    }

    function bindHighlightEvents() {
        if (!ui.listContainer || !ui.minimapContainer) return;

        const highlight = (id, active) => {
            const listItem = ui.listContainer.querySelector(`.process-item-wrapper[data-id="${id}"]`);
            const svgNode = ui.minimapContainer.querySelector(`.svg-node[data-id="${id}"]`);
            if (listItem) listItem.classList.toggle('highlighted', active);
            if (svgNode) svgNode.classList.toggle('highlighted', active);
        };

        ui.listContainer.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.process-item-wrapper');
            if (item) highlight(item.dataset.id, true);
        });
        ui.listContainer.addEventListener('mouseout', (e) => {
            const item = e.target.closest('.process-item-wrapper');
            if (item) highlight(item.dataset.id, false);
        });

        ui.minimapContainer.addEventListener('mouseover', (e) => {
            const node = e.target.closest('.svg-node');
            if (node) highlight(node.dataset.id, true);
        });
        ui.minimapContainer.addEventListener('mouseout', (e) => {
            const node = e.target.closest('.svg-node');
            if (node) highlight(node.dataset.id, false);
        });
    }


    // =================================================================================
    // --- 7. LÓGICA DE NEGOCIO Y MANIPULACIÓN DEL ESTADO (CENTRALIZADA) ---
    // =================================================================================

    function findNodeWithContainer(nodeId, nodes = state.processes) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.id === nodeId) return { node, container: nodes, index: i };
            
            if (node.children) {
                const foundInYes = findNodeWithContainer(nodeId, node.children.yes || []);
                if (foundInYes) return foundInYes;
                const foundInNo = findNodeWithContainer(nodeId, node.children.no || []);
                if (foundInNo) return foundInNo;
            }
            if (node.rejectionFlow) {
                const foundInRejection = findNodeWithContainer(nodeId, node.rejectionFlow);
                if (foundInRejection) return foundInRejection;
            }
        }
        return null;
    }

    function getContainerFromPath(path) {
        if (!path) return state.processes;
        
        const parts = path.split('.');
        const parentId = parts[0];
        const branch = parts[1];

        const parentResult = findNodeWithContainer(parentId);
        if (!parentResult) return null;

        const parentNode = parentResult.node;
        if (branch === 'rejection') return parentNode.rejectionFlow;
        if (parentNode.children && parentNode.children[branch]) return parentNode.children[branch];
        
        return null;
    }

    function moveProcess(movedItemId, fromPath, toPath, newIndex) {
        if (toPath && toPath.startsWith(movedItemId)) {
            showToast('No se puede mover un proceso dentro de sí mismo.', 'error');
            renderProcessList();
            return;
        }

        const fromContainer = getContainerFromPath(fromPath);
        const toContainer = getContainerFromPath(toPath);

        if (!fromContainer || !toContainer) {
            console.error("Error al mover: no se encontró el contenedor de origen o destino.");
            showToast("Error al mover el proceso.", "error");
            renderProcessList();
            return;
        }

        const itemIndex = fromContainer.findIndex(p => p.id === movedItemId);
        if (itemIndex === -1) {
            console.warn("No se encontró el item a mover. Forzando re-renderizado.");
            renderProcessList();
            return;
        }
        const [movedItem] = fromContainer.splice(itemIndex, 1);

        toContainer.splice(newIndex, 0, movedItem);
        
        validateAndCleanTransportFlows();
        setUnsavedChanges(true);
        renderProcessList();
        debouncedUpdateMinimap();
    }

    function removeProcess(processId) {
        const found = findNodeWithContainer(processId);
        if (found) {
            found.container.splice(found.index, 1);
            
            validateAndCleanTransportFlows();
            setUnsavedChanges(true);
            renderProcessList();
            debouncedUpdateMinimap();
        }
    }

    function updateProcess(processId, updates) {
        const found = findNodeWithContainer(processId);
        if (found) {
            Object.assign(found.node, updates);
            setUnsavedChanges(true);
            debouncedUpdateMinimap();
        }
    }

    function handleAddStep(type, path = null) {
        const typeInfo = processTypes[type];
        if (!typeInfo) return;

        const baseNode = {
            id: `step_${Date.now()}`,
            name: typeInfo.label,
            type: type,
            isStep: true,
            isValid: true,
            opNumber: null,
            isCritical: false,
            isInspection: false,
            rejectionType: null,
            reprocessTargetId: null,
            reprocessLabel: null,
            children: null
        };

        if (type === 'scrap' || type === 'unir') {
            addItemsToContainer(baseNode, path);
            return;
        }

        const modalHTML = templates.addStepModal(typeInfo);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        const modal = document.getElementById('add-step-modal');
        const nameInput = document.getElementById('step-name-input');
        const saveBtn = document.getElementById('save-step-btn');
        
        const closeModal = () => modal.remove();
        
        modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => btn.onclick = closeModal);

        const saveAction = () => {
            const name = nameInput.value.trim();
            if (!name) {
                showToast('La descripción no puede estar vacía.', 'error');
                return;
            }

            const newStep = { ...baseNode, name };

            if (type === 'decision') newStep.children = { yes: [], no: [] };
            if (type === 'inspection') newStep.rejectionFlow = [];
            
            addItemsToContainer(newStep, path);
            closeModal();
        };

        saveBtn.onclick = saveAction;
        nameInput.onkeydown = (e) => {
            if (e.key === 'Enter') saveAction();
        };
        nameInput.focus();
        nameInput.select();
    }

    function openAddMenu(button, path) {
        const menuId = 'add-context-menu';
        document.getElementById(menuId)?.remove();

        const stepItems = Object.entries(processTypes)
            .filter(([,v]) => v.isStep)
            .map(([k,v]) => `<a href="#" data-action="add-step" data-type="${k}" data-path="${path}" class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md text-sm">${v.label}</a>`)
            .join('');

        const menu = document.createElement('div');
        menu.id = menuId;
        menu.className = 'absolute z-20 mt-2 w-56 bg-white border rounded-lg shadow-xl p-2';
        menu.innerHTML = `
            <div class="font-bold text-xs uppercase text-slate-400 px-2 py-1">Agregar Paso</div>
            ${stepItems}
            <div class="border-t my-2"></div>
            <a href="#" data-action="add-process" data-path="${path}" class="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md text-sm">
                <i data-lucide="database" class="h-4 w-4"></i> Proceso Existente
            </a>
        `;

        document.body.appendChild(menu);
        lucide.createIcons();
        const rect = button.getBoundingClientRect();
        
        const menuHeight = menu.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < menuHeight && rect.top > menuHeight) {
            menu.style.top = `${rect.top + window.scrollY - menuHeight}px`;
        } else {
            menu.style.top = `${rect.bottom + window.scrollY}px`;
        }
        menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth + rect.width}px`;

        menu.onclick = (e) => {
            const link = e.target.closest('a[data-action]');
            if (link) {
                e.preventDefault();
                const action = link.dataset.action;
                const type = link.dataset.type;
                const targetPath = link.dataset.path;
                if (action === 'add-step') {
                    handleAddStep(type, targetPath);
                } else if (action === 'add-process') {
                    openProcessSelectionModal(targetPath);
                }
            }
            menu.remove();
        };

        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 0);
    }

    function getAllProcessIdsInFlowchart() {
        const ids = new Set();
        function traverse(nodes) {
            if (!nodes) return;
            for (const node of nodes) {
                ids.add(node.id);
                if (node.children) {
                    traverse(node.children.yes);
                    traverse(node.children.no);
                }
            }
        }
        traverse(state.processes);
        return ids;
    }

    async function openProcessSelectionModal(path = null) {
        const existingIds = getAllProcessIdsInFlowchart();
        const modalHTML = `<div id="process-selection-modal" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[1055] animate-fade-in"><div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-scale-in h-[90vh]"><div class="p-5 border-b flex justify-between items-center"><h2 class="text-xl font-bold text-slate-800">Seleccionar Procesos de Base de Datos</h2><button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-5 flex-grow flex flex-col min-h-0"><input type="text" id="process-search-input" placeholder="Buscar proceso..." class="w-full px-4 py-2 border rounded-lg mb-4 flex-shrink-0"><div id="process-search-results" class="flex-grow overflow-y-auto border rounded-lg"></div></div><div class="p-5 border-t bg-slate-50 flex justify-end flex-shrink-0"><button id="add-selected-processes-btn" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700" disabled>Agregar</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        const modal = document.getElementById('process-selection-modal');
        const searchInput = document.getElementById('process-search-input');
        const resultsContainer = document.getElementById('process-search-results');
        const addBtn = document.getElementById('add-selected-processes-btn');
        let selectedProcesses = new Set();

        const closeModal = () => modal.remove();
        modal.querySelector('[data-action="close-modal"]').onclick = closeModal;

        const updateAddButton = () => {
            addBtn.disabled = selectedProcesses.size === 0;
            addBtn.textContent = `Agregar ${selectedProcesses.size} Proceso(s)`;
        };

        const fetchAndRenderProcesses = async (searchTerm = '') => {
            try {
                resultsContainer.innerHTML = templates.loadingState('Buscando...');
                const q = firestore.query(firestore.collection(db, COLLECTIONS.PROCESOS), firestore.orderBy('numero'));
                const querySnapshot = await firestore.getDocs(q);
                const allProcesses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const filtered = allProcesses.filter(p => p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

                if (filtered.length === 0) {
                    resultsContainer.innerHTML = `<p class="p-4 text-center text-slate-500">No se encontraron procesos.</p>`; return;
                }
                resultsContainer.innerHTML = filtered.map(proc => {
                    const isAlreadyAdded = existingIds.has(proc.id);
                    return `
                    <label for="proc-check-${proc.id}" class="p-3 flex items-center border-b last:border-b-0 ${isAlreadyAdded ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}">
                        <input type="checkbox" id="proc-check-${proc.id}" data-id="${proc.id}" data-name="${proc.descripcion}" data-number="${proc.numero}" class="h-4 w-4 mr-4" ${isAlreadyAdded ? 'disabled' : ''}>
                        <div>
                            <p class="font-semibold ${isAlreadyAdded ? '' : 'text-slate-800'}">${proc.numero} - ${proc.descripcion}</p>
                            ${isAlreadyAdded ? '<p class="text-xs font-bold text-blue-600">YA EN EL FLUJO</p>' : ''}
                        </div>
                    </label>
                `}).join('');

                document.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(checkbox => {
                    checkbox.onchange = () => {
                        if (checkbox.checked) selectedProcesses.add(checkbox.dataset.id);
                        else selectedProcesses.delete(checkbox.dataset.id);
                        updateAddButton();
                    };
                });
            } catch (error) {
                console.error("Error buscando procesos:", error);
                resultsContainer.innerHTML = templates.errorState('Error al buscar procesos.');
            }
        };
        
        addBtn.onclick = async () => {
            const processesToAdd = [];
            for (const id of selectedProcesses) {
                const checkbox = document.querySelector(`input[data-id="${id}"]`);
                if (checkbox) {
                    processesToAdd.push({ 
                        id: id, 
                        name: checkbox.dataset.name, 
                        opNumber: checkbox.dataset.number,
                        type: 'operation',
                        isStep: false,
                    });
                }
            }
            
            addItemsToContainer(processesToAdd, path);
            closeModal();
        };

        searchInput.oninput = () => fetchAndRenderProcesses(searchInput.value);
        fetchAndRenderProcesses();
    }

    function addItemsToContainer(items, path) {
        const container = getContainerFromPath(path);
        if (container) {
            const itemsArray = Array.isArray(items) ? items : [items];
            container.push(...itemsArray);
            setUnsavedChanges(true);
            renderProcessList();
            debouncedUpdateMinimap();
            
            const lastItem = itemsArray[itemsArray.length - 1];
            setTimeout(() => scrollToProcess(lastItem.id), 50);

        } else {
            showToast('Error: No se pudo encontrar la rama de destino.', 'error');
        }
    }

    function scrollToProcess(processId) {
        const element = document.getElementById(`process-item-${processId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('animate-pulse-once');
            setTimeout(() => element.classList.remove('animate-pulse-once'), 2000);
        }
    }

    function checkForTerminalErrors() {
        function traverse(nodes) {
            if (!nodes) return;
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                const typeInfo = processTypes[node.type];
                
                node.hasTerminalError = false;

                if (typeInfo?.isTerminal && i < nodes.length - 1) {
                    node.hasTerminalError = true;
                }

                if (node.children) {
                    traverse(node.children.yes);
                    traverse(node.children.no);
                }
                if (node.rejectionFlow) {
                    traverse(node.rejectionFlow);
                }
            }
        }
        traverse(state.processes);
    }


    // =================================================================================
    // --- 8. PERSISTENCIA, BLOQUEO Y VERSIONES (FIRESTORE) ---
    // =================================================================================

    async function acquireFlowchartLock(productId) {
        const lockRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, productId);
        try {
            const docSnap = await firestore.getDoc(lockRef);
            if (docSnap.exists() && docSnap.data().lock) {
                const lockData = docSnap.data().lock;
                const lockTime = lockData.timestamp.toDate();
                const now = new Date();
                if (now - lockTime > 15 * 60 * 1000) { // 15 minutos de timeout
                    await releaseFlowchartLock(productId);
                    return null;
                }
                if (lockData.userEmail !== appState.currentUser.email) {
                    return lockData;
                }
            }
            await firestore.setDoc(lockRef, {
                lock: { userEmail: appState.currentUser.email, timestamp: firestore.serverTimestamp() }
            }, { merge: true });
            appState.currentFlowchartLock = { productId };
            return null;
        } catch (e) {
            console.error("Error al adquirir el bloqueo:", e);
            return { userEmail: 'Error', error: true };
        }
    }

    async function releaseFlowchartLock(productId) {
        if (!productId) return;
        const lockRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, productId);
        try {
            await firestore.updateDoc(lockRef, { lock: firestore.deleteField() });
            appState.currentFlowchartLock = null;
        } catch (e) {
            if (e.code !== 'not-found') {
                console.error("Error al liberar el bloqueo:", e);
            }
        }
    }

    async function saveProcessOrder(producto) {
        if (!ui.saveButton || ui.saveButton.disabled) return;

        ui.saveButton.disabled = true;
        ui.saveButton.innerHTML = `<div class="loading-spinner h-4 w-4 border-2 border-white/50 border-l-white mx-auto"></div><span class="ml-2">Guardando...</span>`;
        ui.saveButton.classList.remove('bg-orange-500', 'bg-green-500');
        ui.saveButton.classList.add('bg-blue-600');
        lucide.createIcons();

        try {
            const cleanData = (nodes) => {
                return nodes.map(p => {
                    const cleanedNode = {
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        opNumber: p.opNumber || null,
                        isCritical: p.isCritical || false,
                        isStep: p.isStep || false,
                        isInspection: p.isInspection || false,
                        rejectionType: p.rejectionType || null,
                        reprocessTargetId: p.reprocessTargetId || null,
                        reprocessLabel: p.reprocessLabel || null,
                    };
                    if (p.children) {
                        cleanedNode.children = {
                            yes: cleanData(p.children.yes || []),
                            no: cleanData(p.children.no || [])
                        };
                    }
                    return cleanedNode;
                });
            };
            const cleanProcessOrder = cleanData(state.processes);

            const versionData = {
                header: state.header,
                processOrder: cleanProcessOrder,
                transportFlows: state.transportFlows,
                savedAt: firestore.serverTimestamp(),
                savedBy: appState.currentUser.email
            };

            // Siempre crear una nueva versión en el historial al guardar manualmente
            const versionsColRef = firestore.collection(db, COLLECTIONS.FLUJOGRAMAS, producto.docId, 'versions');
            await firestore.addDoc(versionsColRef, versionData);

            const mainDocRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, producto.docId);
            await firestore.setDoc(mainDocRef, {
                ...versionData,
                lastUpdated: versionData.savedAt,
                updatedBy: versionData.savedBy,
                productoId: producto.id,
                productoDescripcion: producto.descripcion
            }, { merge: true });

            showToast('Flujograma guardado con éxito.', 'success');
            
            setUnsavedChanges(false);
            state.lastUpdated = new Date();
            state.updatedBy = appState.currentUser.email;
            
            // Actualizar UI después de un breve retraso para que el usuario vea el estado "Guardado"
            setTimeout(() => {
                if (ui.lastUpdatedInfo) {
                    ui.lastUpdatedInfo.textContent = `Última mod.: ${state.lastUpdated.toLocaleString()} por ${state.updatedBy || 'desconocido'}`;
                }
            }, 1000);

        } catch (error) {
            console.error("Error al guardar:", error);
            showToast('Error al guardar el flujograma.', 'error');
            setUnsavedChanges(true); // Re-activar el estado de "cambios sin guardar" si falla
        }
    }

    async function showVersionHistory(producto) {
        const modalHTML = `<div id="history-modal" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[1055] animate-fade-in"><div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-scale-in h-[90vh]"><div class="p-5 border-b flex justify-between items-center"><h2 class="text-xl font-bold text-slate-800">Historial de Versiones</h2><button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button></div><div id="history-list" class="p-5 flex-grow overflow-y-auto"></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();
        
        const modal = document.getElementById('history-modal');
        const listContainer = document.getElementById('history-list');
        const closeModal = () => modal.remove();
        modal.querySelector('[data-action="close-modal"]').onclick = closeModal;

        try {
            listContainer.innerHTML = templates.loadingState('Cargando historial...');
            const versionsColRef = firestore.collection(db, COLLECTIONS.FLUJOGRAMAS, producto.docId, 'versions');
            const qVersions = firestore.query(versionsColRef, firestore.orderBy('savedAt', 'desc'));
            const querySnapshot = await firestore.getDocs(qVersions);

            if (querySnapshot.empty) {
                listContainer.innerHTML = `<p class="text-center text-slate-500">No hay historial de versiones.</p>`;
                return;
            }

            listContainer.innerHTML = querySnapshot.docs.map((doc, index) => {
                const data = doc.data();
                return `
                <div class="p-3 border rounded-lg mb-2 flex justify-between items-center ${index === 0 ? 'bg-blue-50 border-blue-200' : ''}">
                    <div>
                        <p class="font-semibold">${data.savedAt.toDate().toLocaleString()}</p>
                        <p class="text-sm text-slate-500">Guardado por: ${data.savedBy}</p>
                    </div>
                    <div>
                        <button data-action="restore-version" data-id="${doc.id}" class="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Restaurar</button>
                    </div>
                </div>
                `;
            }).join('');
            
            document.querySelectorAll('[data-action="restore-version"]').forEach(btn => {
                btn.onclick = async () => {
                    if (!confirm('¿Está seguro? Se cargará el contenido de esta versión en el editor. Deberá guardarla para crear una nueva versión a partir de esta.')) return;
                    const versionId = btn.dataset.id;
                    const versionDocRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, producto.docId, 'versions', versionId);
                    const versionSnap = await firestore.getDoc(versionDocRef);
                    if (versionSnap.exists()) {
                        await loadAndValidateData(producto, versionSnap.data());
                        showToast('Versión cargada. Guarde para confirmar la restauración.', 'info');
                        closeModal();
                    }
                };
            });

        } catch (error) {
            console.error("Error al cargar historial:", error);
            listContainer.innerHTML = templates.errorState('No se pudo cargar el historial.');
        }
    }

    async function cloneFlowchart(producto) {
        const modalHTML = `<div id="clone-modal" class="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-[1055] animate-fade-in"><div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-scale-in"><div class="p-5 border-b flex justify-between items-center"><h2 class="text-xl font-bold text-slate-800">Clonar a otro Producto</h2><button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-5"><input type="text" id="product-search-input" placeholder="Buscar producto de destino..." class="w-full px-4 py-2 border rounded-lg mb-4"><div id="product-search-results" class="max-h-80 overflow-y-auto border rounded-lg"></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        const modal = document.getElementById('clone-modal');
        const searchInput = document.getElementById('product-search-input');
        const resultsContainer = document.getElementById('product-search-results');
        const closeModal = () => modal.remove();
        modal.querySelector('[data-action="close-modal"]').onclick = closeModal;

        const fetchAndRenderProducts = async (searchTerm = '') => {
            try {
                resultsContainer.innerHTML = templates.loadingState('Buscando productos...');
                const q = firestore.query(firestore.collection(db, COLLECTIONS.PRODUCTOS));
                const querySnapshot = await firestore.getDocs(q);
                const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const filteredProducts = allProducts.filter(p => p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) && p.id !== producto.id);

                if (filteredProducts.length === 0) {
                    resultsContainer.innerHTML = `<p class="p-4 text-center text-slate-500">No se encontraron productos.</p>`; return;
                }
                resultsContainer.innerHTML = filteredProducts.map(prod => `
                    <div data-id="${prod.id}" data-name="${prod.descripcion}" class="product-select-item p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0">
                        <p class="font-semibold text-slate-700">${prod.descripcion}</p>
                    </div>
                `).join('');

                document.querySelectorAll('.product-select-item').forEach(item => {
                    item.onclick = async () => {
                        const newProductId = item.dataset.id;
                        const newProductName = item.dataset.name;
                        await performClone(newProductId, newProductName);
                        closeModal();
                    };
                });
            } catch (error) {
                console.error("Error buscando productos:", error);
                resultsContainer.innerHTML = templates.errorState('Error al buscar productos.');
            }
        };
        searchInput.oninput = () => fetchAndRenderProducts(searchInput.value);
        fetchAndRenderProducts();
    }

    async function performClone(newProductId, newProductName) {
        try {
            const targetRef = firestore.doc(db, COLLECTIONS.FLUJOGRAMAS, newProductId);
            const targetSnap = await firestore.getDoc(targetRef);
            if (targetSnap.exists()) {
                if (!confirm(`El producto "${newProductName}" ya tiene un flujograma. ¿Desea sobrescribirlo? Esta acción no se puede deshacer.`)) {
                    return;
                }
            }

            const cleanData = (nodes) => {
                return nodes.map(p => {
                    const cleanedNode = {
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        opNumber: p.opNumber || null,
                        isInspection: p.isInspection || false,
                        isCritical: p.isCritical || false,
                        isStep: p.isStep || false,
                        rejectionType: p.rejectionType || null,
                        reprocessTargetId: p.reprocessTargetId || null
                    };
                    if (p.children) {
                        cleanedNode.children = {
                            yes: cleanData(p.children.yes || []),
                            no: cleanData(p.children.no || [])
                        };
                    }
                    return cleanedNode;
                });
            };
            const cleanProcessOrder = cleanData(state.processes);

            const newFlowchartData = {
                header: { ...state.header, revision: '1' },
                processOrder: cleanProcessOrder,
                transportFlows: state.transportFlows,
                lastUpdated: firestore.serverTimestamp(),
                updatedBy: appState.currentUser.email,
                productoId: newProductId,
                productoDescripcion: newProductName
            };
            
            await firestore.setDoc(targetRef, newFlowchartData);

            showToast(`Flujograma clonado con éxito a ${newProductName}.`, 'success');
        } catch (error) {
            console.error("Error al clonar:", error);
            showToast('Ocurrió un error durante la clonación.', 'error');
        }
    }

    function setUnsavedChanges(hasChanges) {
        state.hasUnsavedChanges = hasChanges;
        if (!ui.saveButton) return;

        ui.saveButton.disabled = !hasChanges;
        if (hasChanges) {
            ui.saveButton.innerHTML = `<i data-lucide="save" class="mr-2 h-4 w-4"></i>Guardar`;
            ui.saveButton.classList.remove('bg-blue-600', 'bg-green-500');
            ui.saveButton.classList.add('bg-orange-500');
        } else {
            ui.saveButton.innerHTML = `<i data-lucide="check" class="mr-2 h-4 w-4"></i>Guardado`;
            ui.saveButton.classList.remove('bg-blue-600', 'bg-orange-500');
            ui.saveButton.classList.add('bg-green-500');
        }
        lucide.createIcons();
    }


    // =================================================================================
    // --- 9. LÓGICA DE EXPORTACIÓN (PDF) ---
    // =================================================================================

    function loadImageAsDataUrl(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.onload = function() {
                if (this.status === 200) {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(this.response);
                } else {
                    reject(new Error(`Failed to load image: ${url}`));
                }
            };
            xhr.onerror = reject;
            xhr.send();
        });
    }

    async function svgStringToCanvas(svgString, width, height) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 2; // Aumentar la resolución para el PDF
                canvas.width = width * scale;
                canvas.height = height * scale;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                URL.revokeObjectURL(url);
                resolve(canvas);
            };

            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(new Error('No se pudo cargar el SVG en un elemento de imagen.'));
            };

            img.src = url;
        });
    }

    function drawSymbol(doc, type, x, y, size) {
        const typeInfo = processTypes[type];
        if (!typeInfo) return;

        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const strokeColor = '#475569';
        const fillColor = typeInfo.color;

        doc.setDrawColor(strokeColor);
        doc.setFillColor(fillColor);
        doc.setLineWidth(0.8);

        switch (typeInfo.shape) {
            case 'square':
                doc.rect(x, y, size, size, 'FD');
                break;
            case 'diamond':
                doc.path([
                    { op: 'm', c: [centerX, y] },
                    { op: 'l', c: [x + size, centerY] },
                    { op: 'l', c: [centerX, y + size] },
                    { op: 'l', c: [x, centerY] },
                    { op: 'h' }
                ]).fillStroke();
                break;
            case 'triangle_down':
                doc.path([
                    { op: 'm', c: [x, y] },
                    { op: 'l', c: [x + size, y] },
                    { op: 'l', c: [centerX, y + size] },
                    { op: 'h' }
                ]).fillStroke();
                break;
            case 'oval':
                doc.ellipse(centerX, centerY, size / 2, size / 3, 'FD');
                break;
            case 'join_dot':
                doc.setFillColor(strokeColor);
                doc.circle(centerX, centerY, size / 4, 'F');
                break;
            default: // circle
                doc.circle(centerX, centerY, size / 2, 'FD');
                break;
        }
    }

    async function addHeaderAndFooter(doc, producto, title, logoDataUrl) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 40;

            if (logoDataUrl) {
                const imgProps = doc.getImageProperties(logoDataUrl);
                const imgHeight = 40;
                const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                doc.addImage(logoDataUrl, 'PNG', margin, 25, imgWidth, imgHeight);
            }
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1e293b');
            
            doc.setFontSize(20);
            doc.text(title.toUpperCase(), pageWidth - margin, 45, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Para producto: ${producto.descripcion}`, pageWidth - margin, 65, { align: 'right' });
            
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1.5);
            doc.line(margin, 85, pageWidth - margin, 85);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            const date = new Date().toLocaleDateString('es-AR');
            doc.text('BARACK MERCOSUL', margin, pageHeight - margin + 10);
            doc.text(`Generado el ${date}`, pageWidth / 2, pageHeight - margin + 10, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - margin + 10, { align: 'right' });
        }
    }

    async function exportFlowchart(producto, format) {
        if (format !== 'pdf') {
            showToast('Actualmente solo se soporta exportación a PDF.', 'info');
            return;
        }
        if (state.processes.length === 0) { 
            showToast('No hay procesos para exportar.', 'error'); 
            return; 
        }
        showToast(`Generando PDF...`, 'info');

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const logoDataUrl = await loadImageAsDataUrl('./logo.png').catch(() => null);
            const margin = 40;
            const placeholder = '--';
            const pageWidth = doc.internal.pageSize.width;
            
            const baseTableStyles = {
                theme: 'grid',
                styles: { 
                    fontSize: 10, 
                    cellPadding: { top: 6, right: 8, bottom: 6, left: 8 },
                    lineColor: '#cbd5e1',
                    lineWidth: 0.5
                },
                margin: { left: margin, right: margin }
            };

            const placeholderStyles = {
                textColor: '#94a3b8',
                fontStyle: 'italic'
            };

            const cliente = appState.collectionsById[COLLECTIONS.CLIENTES].get(producto.clienteId)?.descripcion || producto.clienteId;

            const infoData = [
                [{ content: 'Nombre de la organización:', styles: { fontStyle: 'bold' } }, { content: state.header.organizacion, colSpan: 3 }],
                [{ content: 'Proyecto:', styles: { fontStyle: 'bold' } }, { content: state.header.proyecto || placeholder, styles: state.header.proyecto ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Número de identificación del documento:', styles: { fontStyle: 'bold' } }, { content: state.header.docId || placeholder, styles: state.header.docId ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Fecha de inicio:', styles: { fontStyle: 'bold' } }, { content: state.header.fecha_inicio || placeholder, styles: state.header.fecha_inicio ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Fecha de última revisión:', styles: { fontStyle: 'bold' } }, { content: state.header.fecha_ultima_revision || placeholder, styles: state.header.fecha_ultima_revision ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Responsable de la elaboración:', styles: { fontStyle: 'bold' } }, { content: state.header.responsable_elaboracion || placeholder, styles: state.header.responsable_elaboracion ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Nombre del cliente:', styles: { fontStyle: 'bold' } }, { content: cliente || placeholder, styles: cliente ? {} : placeholderStyles, colSpan: 3 }],
                [{ content: 'Locación de la planta:', styles: { fontStyle: 'bold' } }, { content: state.header.locacion_planta, colSpan: 3 }],
            ];
            
            doc.autoTable({
                ...baseTableStyles,
                body: infoData,
                startY: 110,
                columnStyles: {
                    0: { cellWidth: 200, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }
                },
                didDrawPage: (data) => {
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#1e293b');
                    doc.text('Carátula del Documento', data.settings.margin.left, 100);
                }
            });

            const lastInfoTableY = doc.autoTable.previous.finalY;

            doc.setDrawColor(100, 116, 139);
            doc.setLineWidth(2);
            doc.line(margin, lastInfoTableY + 30, pageWidth - margin, lastInfoTableY + 30);

            const symbolsBody = Object.entries(processTypes)
                .filter(([key]) => key === 'operation' || processTypes[key].isStep)
                .map(([key, type]) => ({
                    type: key,
                    label: type.label,
                    description: type.description
                }));
            
            doc.autoTable({
                ...baseTableStyles,
                head: [['Símbolo', 'Tipo', 'Descripción']],
                body: symbolsBody.map(item => [ '\n \n', item.label, item.description ]),
                startY: lastInfoTableY + 60,
                headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
                styles: { ...baseTableStyles.styles, fontSize: 9, valign: 'middle' },
                columnStyles: { 
                    0: { cellWidth: 60, halign: 'center' },
                    1: { fontStyle: 'bold', cellWidth: 100 },
                },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) {
                        const item = symbolsBody[data.row.index];
                        const symbolSize = 26;
                        const x = data.cell.x + (data.cell.width - symbolSize) / 2;
                        const y = data.cell.y + (data.cell.height - symbolSize) / 2;
                        drawSymbol(doc, item.type, x, y, symbolSize);
                    }
                }
            });

            if (state.processes.length > 0) {
                doc.addPage('a4', 'p');
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor('#1e293b');
                doc.text('Diagrama de Flujo', margin, 105);

                const layout = calculateLayout(state.processes);
                const exportViewBox = { x: 0, y: 0, width: layout.width, height: layout.height };
                const svgForExport = renderSvg(layout, exportViewBox, true);
                const canvas = await svgStringToCanvas(svgForExport, layout.width, layout.height);
                const imgData = canvas.toDataURL('image/png');

                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                const pageMargin = 40; 
                const headerHeight = 115; 
                const footerHeight = 40;

                const availableWidth = pdfWidth - (pageMargin * 2);
                const availableHeight = pdfHeight - headerHeight - footerHeight;

                const ratio = imgProps.width / imgProps.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / ratio;

                if (imgHeight > availableHeight) {
                    imgHeight = availableHeight;
                    imgWidth = imgHeight * ratio;
                }

                const x = (pdfWidth - imgWidth) / 2;
                const y = headerHeight;

                doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            }
            
            await addHeaderAndFooter(doc, producto, 'Flujograma de Proceso', logoDataUrl);
            
            doc.save(`Flujograma_${producto.descripcion.replace(/\s/g, '_')}.pdf`);
            showToast('PDF generado con éxito.', 'success');

        } catch (error) {
            console.error("Error al exportar:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            showToast(`Ocurrió un error al generar el archivo: ${errorMessage}`, "error");
        }
    }


    // =================================================================================
    // --- 10. UTILIDADES Y FUNCIONES AUXILIARES ---
    // =================================================================================

    function getAllOperations() {
        const steps = [];
        function traverse(nodes) {
            if (!nodes) return;
            nodes.forEach(node => {
                if (node.type === 'operation') {
                    steps.push({
                        id: node.id,
                        name: node.name,
                        opNumber: node.opNumber || ''
                    });
                }
                if (node.children) {
                    traverse(node.children.yes);
                    traverse(node.children.no);
                }
            });
        }
        traverse(state.processes);
        return steps;
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function handleMinimapZoom(event) {
        event.preventDefault();
        const zoomIntensity = 0.1;
        const direction = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(direction * zoomIntensity);

        const svg = ui.minimapContainer.querySelector('svg');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const [pointX, pointY] = [
            state.minimap.viewBox.x + mouseX / rect.width * state.minimap.viewBox.width,
            state.minimap.viewBox.y + mouseY / rect.height * state.minimap.viewBox.height
        ];

        state.minimap.viewBox.width /= zoom;
        state.minimap.viewBox.height /= zoom;
        state.minimap.viewBox.x = pointX - mouseX / rect.width * state.minimap.viewBox.width;
        state.minimap.viewBox.y = pointY - mouseY / rect.height * state.minimap.viewBox.height;

        svg.setAttribute('viewBox', `${state.minimap.viewBox.x} ${state.minimap.viewBox.y} ${state.minimap.viewBox.width} ${state.minimap.viewBox.height}`);
    }

    function handleMinimapPanStart(event) {
        event.preventDefault();
        state.minimap.isPanning = true;
        ui.minimapContainer.classList.add('cursor-grabbing');
        state.minimap.panStart.x = event.clientX;
        state.minimap.panStart.y = event.clientY;
    }

    function handleMinimapPanMove(event) {
        if (!state.minimap.isPanning) return;
        event.preventDefault();

        const dx = (event.clientX - state.minimap.panStart.x) * (state.minimap.viewBox.width / ui.minimapContainer.clientWidth);
        const dy = (event.clientY - state.minimap.panStart.y) * (state.minimap.viewBox.height / ui.minimapContainer.clientHeight);

        state.minimap.viewBox.x -= dx;
        state.minimap.viewBox.y -= dy;

        const svg = ui.minimapContainer.querySelector('svg');
        if(svg) {
            svg.setAttribute('viewBox', `${state.minimap.viewBox.x} ${state.minimap.viewBox.y} ${state.minimap.viewBox.width} ${state.minimap.viewBox.height}`);
        }

        state.minimap.panStart.x = event.clientX;
        state.minimap.panStart.y = event.clientY;
    }

    function handleMinimapPanEnd() {
        state.minimap.isPanning = false;
        ui.minimapContainer.classList.remove('cursor-grabbing');
    }

    // --- Lógica para Flujos de Transporte ---

    function validateAndCleanTransportFlows() {
        const allProcessIds = getAllProcessIdsInFlowchart();

        const initialCount = state.transportFlows.length;
        state.transportFlows = state.transportFlows.filter(flow => {
            const fromExists = allProcessIds.has(flow.fromId);
            const toExists = allProcessIds.has(flow.toId);
            if (!fromExists || !toExists) {
                console.warn('Limpiando enlace de transporte roto:', flow);
                return false;
            }
            return true;
        });

        if (state.transportFlows.length < initialCount) {
            setUnsavedChanges(true);
        }
    }


    function startTransportLinking(fromId) {
        if (state.linkingTransportState.isActive && state.linkingTransportState.fromId === fromId) {
            cancelTransportLinking();
            return;
        }

        state.linkingTransportState.isActive = true;
        state.linkingTransportState.fromId = fromId;

        const editorPanel = document.getElementById('editor-panel');
        const indicator = document.getElementById('linking-mode-indicator');
        if (!editorPanel || !indicator) return;

        editorPanel.classList.add('linking-mode');
        indicator.classList.remove('hidden');
        document.querySelectorAll('.linking-source').forEach(el => el.classList.remove('linking-source'));
        document.getElementById(`process-item-${fromId}`)?.classList.add('linking-source');
        indicator.innerHTML = `Origen seleccionado. Ahora elija la <strong>operación de destino</strong>... (ESC para cancelar)`;
    }

    function cancelTransportLinking() {
        state.linkingTransportState.isActive = false;
        state.linkingTransportState.fromId = null;
        
        const editorPanel = document.getElementById('editor-panel');
        const indicator = document.getElementById('linking-mode-indicator');
        if (!editorPanel || !indicator) return;

        editorPanel.classList.remove('linking-mode');
        indicator.classList.add('hidden');
        document.querySelectorAll('.linking-source').forEach(el => el.classList.remove('linking-source'));
        document.querySelectorAll('.invalid-target').forEach(el => el.classList.remove('invalid-target'));
    }

    function isNodeBefore(sourceId, targetId) {
        if (!ui.listContainer) return false;
        const allWrappers = Array.from(ui.listContainer.querySelectorAll('.process-item-wrapper'));
        
        const sourceIndex = allWrappers.findIndex(w => w.dataset.id === sourceId);
        const targetIndex = allWrappers.findIndex(w => w.dataset.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) {
            return false;
        }

        return targetIndex < sourceIndex;
    }


    function completeTransportLinking(toId) {
        const { fromId } = state.linkingTransportState;

        if (!fromId) {
            cancelTransportLinking();
            return;
        }
        
        if (fromId === toId) {
            showToast('No se puede enlazar una operación consigo misma.', 'error');
            cancelTransportLinking();
            return; 
        }

        const toNodeResult = findNodeWithContainer(toId);
        if (!toNodeResult) {
            showToast('El destino seleccionado no es un proceso válido.', 'error');
            cancelTransportLinking();
            return;
        }
        const toNode = toNodeResult.node;

        if (isNodeBefore(fromId, toId)) {
            showToast('No se puede crear un enlace de transporte hacia atrás en el flujo.', 'error');
            cancelTransportLinking();
            return;
        }
        if (toNode.type !== 'operation') {
            showToast('Solo se puede enlazar a operaciones.', 'error');
            cancelTransportLinking();
            return;
        }

        const newLink = {
            id: `transport_${Date.now()}`,
            fromId: fromId,
            toId: toId,
            label: `Transporte a Op. ${toNode?.opNumber || ''}`
        };
        
        state.transportFlows.push(newLink);
        setUnsavedChanges(true);
        renderProcessList();
        debouncedUpdateMinimap();
        
        cancelTransportLinking();
        showToast('Enlace de transporte creado.', 'success');
    }

    function handleTransportNodeClick(nodeId) {
        if (!state.linkingTransportState.isActive) return;
        completeTransportLinking(nodeId);
    }


    function removeTransportLink(linkId) {
        const initialLength = state.transportFlows.length;
        state.transportFlows = state.transportFlows.filter(link => link.id !== linkId);
        if (state.transportFlows.length < initialLength) {
            setUnsavedChanges(true);
            renderProcessList();
            debouncedUpdateMinimap();
        }
    }

    function updateTransportLink(linkId, updates) {
        const link = state.transportFlows.find(l => l.id === linkId);
        if (link) {
            Object.assign(link, updates);
            setUnsavedChanges(true);
            debouncedUpdateMinimap();
        }
    }

    // Objeto exportado por el módulo
    return {
        init,
        runLogic
    };
})();
