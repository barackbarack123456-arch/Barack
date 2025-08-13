// =================================================================================
// --- MÓDULO SINÓPTICO DE PRODUCTO ---
// =================================================================================

export const sinopticoModule = {
    // Referencias a servicios y estado de la app
    app: null,
    db: null,
    uiService: null,
    dataService: null,
    switchView: null,
    schemas: null,
    COLLECTIONS: null,
    firestore: null,

    // Estado local del módulo
    state: {
        currentTree: null,
        selectedProduct: null,
        cleanupFunctions: [],
        isEditMode: false,
        sortKey: 'title',
        sortDir: 'asc',
    },

    /**
     * Inicializa el módulo, guardando referencias a los servicios de la app.
     * Se llama una sola vez desde main.js.
     */
    init(dependencies) {
        this.app = dependencies.appState;
        this.db = dependencies.db;
        this.uiService = dependencies.uiService;
        this.dataService = dependencies.dataService;
        this.switchView = dependencies.switchView;
        this.schemas = dependencies.schemas;
        this.COLLECTIONS = dependencies.COLLECTIONS;
        this.firestore = dependencies.firestore;
    },

    /**
     * Renderiza el HTML estático de la vista del sinóptico.
     * @param {HTMLElement} container - El elemento donde se inyectará el HTML.
     */
    renderLayout(container) {
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- Encabezado Principal -->
                <div class="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-3xl font-extrabold text-slate-800">Sinóptico de Producto</h2>
                        <p class="text-slate-500 mt-1">Construye y visualiza la estructura jerárquica de los productos.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="export-pdf-btn" class="btn btn-secondary"><i data-lucide="file-text" class="mr-2 h-4 w-4"></i>Exportar PDF</button>
                        <button id="toggle-edit-mode-btn" class="btn btn-secondary"><i data-lucide="edit" class="mr-2 h-4 w-4"></i>Modo Edición</button>
                        <button id="save-tree-btn" class="btn btn-primary" disabled><i data-lucide="save" class="mr-2 h-4 w-4"></i>Guardar Cambios</button>
                    </div>
                </div>

                <!-- Panel de Controles y Filtros -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        <div>
                            <label for="product-select" class="block text-sm font-medium text-slate-700">Seleccionar Producto Principal</label>
                            <select id="product-select" class="w-full mt-1 p-2 border rounded-md shadow-sm">
                                <option value="">Cargando productos...</option>
                            </select>
                        </div>
                        <div>
                            <label for="sinoptico-search" class="block text-sm font-medium text-slate-700">Buscar en la estructura</label>
                            <div class="relative">
                                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"></i>
                                <input type="text" id="sinoptico-search" class="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Filtrar por nombre, ID, etc.">
                            </div>
                        </div>
                        <div id="edit-mode-controls" class="hidden flex items-center gap-2">
                             <button id="add-node-btn" class="btn btn-secondary text-sm"><i data-lucide="plus-circle" class="mr-2 h-4 w-4"></i>Añadir Componente</button>
                             <button id="remove-node-btn" class="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm"><i data-lucide="trash-2" class="mr-2 h-4 w-4"></i>Quitar Seleccionado</button>
                        </div>
                    </div>
                </div>

                <!-- Contenedor del Árbol -->
                <div id="sinoptico-tree-wrapper" class="bg-white rounded-xl shadow-sm border border-slate-200 p-4" style="height: calc(100vh - 280px); overflow: auto;">
                    <div id="sinoptico-tree-container">
                       <p class="p-8 text-center text-slate-500">Seleccione un producto para comenzar.</p>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this._populateProductSelector();
    },

    /**
     * Inicializa el árbol de Fancytree con los datos proporcionados.
     * @param {object[]} treeData - Los datos para el árbol.
     */
    _initTree(treeData) {
        const treeContainer = document.getElementById('sinoptico-tree-container');
        if (!treeContainer) return;

        if (typeof jQuery === 'undefined' || typeof jQuery.fn.fancytree !== 'function') {
            this.uiService.showToast('Error: La librería Fancytree no se cargó correctamente.', 'error');
            treeContainer.querySelector('tbody').innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-500">Error crítico: Fancytree no está disponible.</td></tr>';
            return;
        }

        if (jQuery(treeContainer).data('ui-fancytree')) {
            jQuery(treeContainer).fancytree('destroy');
        }

        jQuery(treeContainer).fancytree({
            extensions: ["dnd5", "edit", "filter", "connectors"],
            source: treeData,
            connectors: {
                type: 'line',
                style: 'dashed'
            },
            dnd5: {
                preventRecursion: true,
                preventVoidMoves: true,
                dragStart: (node, data) => true,
                dragEnter: (node, data) => ["before", "after", "over"],
                dragDrop: (node, data) => {
                    data.otherNode.moveTo(node, data.hitMode);
                    this._markAsDirty();
                }
            },
            filter: {
                mode: "hide",
                autoExpand: true,
            },
            init: (event, data) => {
                // Render all icons after the tree is loaded
                lucide.createIcons();
            },
            renderNode: (event, data) => {
                const node = data.node;
                const $span = $(node.span);
                const iconMap = {
                    'productos': 'car-front',
                    'subproductos': 'cog',
                    'insumos': 'component'
                };
                const iconName = iconMap[node.data.collection] || 'file-text';

                // Clear the default icon and title
                $span.find('.fancytree-icon, .fancytree-title').remove();

                // Add custom rendering
                $span.append(`<i data-lucide="${iconName}" class="inline-block h-5 w-5 mr-2 text-slate-600 align-middle"></i>`);
                $span.append(`<span class="fancytree-title text-slate-800 font-semibold align-middle">${node.title}</span>`);

                // Add additional info
                 const infoText = this._getNodeInfoText(node);
                 if (infoText) {
                    $span.append(`<span class="ml-4 text-sm text-slate-500">${infoText}</span>`);
                 }

                if (this.state.isEditMode) {
                    const $qtySpan = $(`<span class="ml-4 px-2 py-0.5 bg-blue-100 rounded-full text-xs cursor-pointer hover:bg-blue-200">Qty: ${node.data.cantidad || 1}</span>`);
                    $span.append($qtySpan);
                    this._setupEditable($qtySpan, node, 'cantidad', true);
                }
            }
        });
    },

    _getNodeInfoText(node) {
        const data = node.data;
        switch (data.collection) {
            case 'productos':
                return `(Versión: ${data.version || 'N/A'})`;
            case 'subproductos':
                 return `(Proceso: ${this._getRelatedDesc(this.COLLECTIONS.PROCESOS, data.procesoId) || 'N/A'})`;
            case 'insumos':
                return `(Proveedor: ${this._getRelatedDesc(this.COLLECTIONS.PROVEEDORES, data.proveedorId) || 'N/A'})`;
            default:
                return '';
        }
    },

    _getRelatedDesc(collectionName, docId) {
        if (!docId) return null;
        const doc = this.app.collectionsById[collectionName]?.get(docId);
        return doc ? doc.descripcion : docId;
    },

    /**
     * Carga los productos de la base de datos y los muestra en el selector.
     */
    _populateProductSelector() {
        const select = document.getElementById('product-select');
        if (!select) return;

        const products = this.app.collections[this.COLLECTIONS.PRODUCTOS] || [];
        if (products.length > 0) {
            select.innerHTML = '<option value="">Seleccione un producto...</option>';
            products.forEach(p => {
                const option = document.createElement('option');
                option.value = p.docId;
                option.textContent = `${p.id} - ${p.descripcion}`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No hay productos disponibles</option>';
        }
    },

    _setupEditable(td, node, key, isNumeric = false) {
        const initialValue = node.data[key] || (isNumeric ? 0 : "");
        td.attr('contenteditable', true).addClass('bg-blue-50 hover:bg-blue-100 cursor-text');

        td.on('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });

        td.on('blur', (e) => {
            let newValue = jQuery(e.target).text();
            td.attr('contenteditable', false).removeClass('bg-blue-50 hover:bg-blue-100 cursor-text');

            if (isNumeric) {
                newValue = parseFloat(newValue);
                if (isNaN(newValue)) {
                    this.uiService.showToast('La cantidad debe ser un número.', 'error');
                    jQuery(e.target).text(node.data[key] || 0); // Revert
                    return;
                }
            }

            if (node.data[key] !== newValue) {
                node.data[key] = newValue;
                this._markAsDirty();
            }
        });
    },

    /**
     * Punto de entrada principal para la vista del sinóptico.
     * Se llama cada vez que se navega a esta vista.
     * @param {HTMLElement} container - El elemento contenedor donde se renderizará la vista.
     * @param {object} payload - Datos pasados desde otra vista (si los hay).
     * @returns {function} Una función de limpieza para ser ejecutada al salir de la vista.
     */
    runLogic(container, payload = {}) {
        // Limpiar estado y listeners anteriores
        this.cleanup();

        // Renderizar la estructura HTML básica de la vista
        this.renderLayout(container);

        // Limpiar el contenido del arbol inicial
        const treeContainer = document.getElementById('sinoptico-tree-container');
        treeContainer.innerHTML = '<p class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</p>';

        // Configurar el event listener para el selector de producto
        const productSelect = document.getElementById('product-select');
        const saveBtn = document.getElementById('save-tree-btn');
        const addBtn = document.getElementById('add-node-btn');
        const removeBtn = document.getElementById('remove-node-btn');
        const searchInput = document.getElementById('sinoptico-search');
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const toggleEditBtn = document.getElementById('toggle-edit-mode-btn');

        const changeHandler = () => {
            const productId = productSelect.value;
            if (productId) {
                this._loadTreeForProduct(productId);
            } else {
                this._initTree([]);
                treeContainer.innerHTML = '<p class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</p>';
                saveBtn.disabled = true;
            }
        };
        const saveHandler = () => this._saveTree();
        const addHandler = () => this._addNode();
        const removeHandler = () => this._removeNode();
        const searchHandler = (e) => this._applyFilter(e.target.value);
        const exportHandler = () => this._exportPdf();
        const toggleEditHandler = () => {
            this.state.isEditMode = !this.state.isEditMode;
            const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');

            document.getElementById('edit-mode-controls').classList.toggle('hidden', !this.state.isEditMode);
            toggleEditBtn.classList.toggle('bg-blue-100', this.state.isEditMode);
            toggleEditBtn.classList.toggle('text-blue-700', this.state.isEditMode);

            if (tree && tree.rootNode) {
                tree.render(true, true);
            }
        };

        productSelect.addEventListener('change', changeHandler);
        saveBtn.addEventListener('click', saveHandler);
        addBtn.addEventListener('click', addHandler);
        removeBtn.addEventListener('click', removeHandler);
        searchInput.addEventListener('input', searchHandler);
        exportPdfBtn.addEventListener('click', exportHandler);
        toggleEditBtn.addEventListener('click', toggleEditHandler);

        this.state.cleanupFunctions.push(() => {
            productSelect.removeEventListener('change', changeHandler);
            saveBtn.removeEventListener('click', saveHandler);
            addBtn.removeEventListener('click', addHandler);
            removeBtn.removeEventListener('click', removeHandler);
            searchInput.removeEventListener('input', searchHandler);
            exportPdfBtn.removeEventListener('click', exportHandler);
            toggleEditBtn.removeEventListener('click', toggleEditHandler);
        });

        // Devolver la función de limpieza
        return this.cleanup.bind(this);
    },

    /**
     * Carga y muestra el árbol sinóptico para un producto específico.
     * @param {string} productId - El ID del documento del producto.
     */
    async _loadTreeForProduct(productId) {
        this.state.selectedProduct = this.app.collectionsById[this.COLLECTIONS.PRODUCTOS].get(productId);
        if (!this.state.selectedProduct) {
            this.uiService.showToast('Error: Producto no encontrado.', 'error');
            return;
        }

        const treeContainer = document.getElementById('sinoptico-tree-container');
        treeContainer.innerHTML = '<div class="p-8 text-center text-slate-500"><div class="loading-spinner mx-auto"></div><p class="mt-2">Cargando estructura...</p></div>';

        try {
            const treeDocRef = this.firestore.doc(this.db, this.COLLECTIONS.ARBOLES, productId);
            const treeDocSnap = await this.firestore.getDoc(treeDocRef);

            let rawTreeData;
            if (treeDocSnap.exists()) {
                // El árbol ya existe en la base de datos
                this.state.currentTree = treeDocSnap.data().nodes || [];
                rawTreeData = this.state.currentTree;
            } else {
                // El árbol no existe, crear uno por defecto con el producto como raíz
                this.uiService.showToast('Creando nueva estructura para este producto.', 'info');
                rawTreeData = [{
                    key: this.state.selectedProduct.docId,
                    collection: this.COLLECTIONS.PRODUCTOS,
                    folder: true,
                    expanded: true,
                    children: [],
                    comentarios: '',
                    cantidad: 1,
                    unidad: 'unidad'
                }];
                this.state.currentTree = rawTreeData;
                this._markAsDirty(); // Habilitar el guardado para la nueva estructura
            }

            const richTreeData = this._enrichTreeData(rawTreeData);
            this._initTree(richTreeData);

        } catch (error) {
            console.error("Error cargando el árbol sinóptico:", error);
            this.uiService.showToast('Error al cargar la estructura del producto.', 'error');
            treeContainer.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-red-500">No se pudo cargar la estructura. Intente de nuevo.</td></tr>';
        }
    },

    /**
     * Enriquece los datos del árbol con información completa de las colecciones cacheadas.
     * @param {object[]} nodes - La lista de nodos a enriquecer.
     * @returns {object[]} La lista de nodos enriquecidos.
     */
    _enrichTreeData(nodes) {
        return nodes.map(node => {
            const doc = this.app.collectionsById[node.collection]?.get(node.key);

            node.title = doc ? `${doc.id} - ${doc.descripcion}` : `Elemento no encontrado (ID: ${node.key})`;

            if (doc) {
                // Copiar datos relevantes del documento al nodo para acceso en renderColumns
                // Fancytree moverá estas propiedades a `node.data` automáticamente.
                node.version = doc.version || '';
                node.materialComponente = doc.materialComponente || '';
                node.color = doc.color || '';
                node.proveedorId = doc.proveedorId || '';
                node.procesoId = doc.procesoId || '';
                // No es necesario reasignar node.collection y node.cantidad, ya están en el objeto.
            } else {
                node.extraClasses = "fancytree-error";
            }

            if (node.children && node.children.length > 0) {
                this._enrichTreeData(node.children);
            }
            return node;
        });
    },

    /**
     * Limpia los listeners de eventos y el estado local del módulo.
     */
    cleanup() {
        this.state.cleanupFunctions.forEach(func => func());
        this.state.cleanupFunctions = [];
        this.state.currentTree = null;
        this.state.selectedProduct = null;
    },

    /**
     * Activa el botón de guardar y notifica al usuario que hay cambios pendientes.
     */
    _markAsDirty() {
        const saveBtn = document.getElementById('save-tree-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios *';
            if (!saveBtn.classList.contains('animate-pulse')) {
                saveBtn.classList.add('animate-pulse');
            }
        }
    },

    /**
     * Guarda la estructura actual del árbol en Firestore.
     */
    async _saveTree() {
        if (!this.state.selectedProduct) {
            this.uiService.showToast('No hay un producto seleccionado para guardar.', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-tree-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5 mx-auto"></i> Guardando...`;
        lucide.createIcons();

        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
        const treeData = tree.toDict(true, (nodeDict) => {
            const cleanNode = {
                key: nodeDict.key,
                collection: nodeDict.data.collection,
                folder: nodeDict.folder,
                comentarios: nodeDict.data.comentarios || '',
                cantidad: nodeDict.data.cantidad || 0,
                unidad: nodeDict.data.unidad || ''
            };
            if (nodeDict.children) {
                cleanNode.children = nodeDict.children;
            }
            return cleanNode;
        });

        try {
            const docRef = this.firestore.doc(this.db, this.COLLECTIONS.ARBOLES, this.state.selectedProduct.docId);
            await this.firestore.setDoc(docRef, { nodes: treeData }, { merge: true });

            this.dataService.logActivity('actualizó el sinóptico', {
                documentName: this.state.selectedProduct.descripcion,
                collection: this.COLLECTIONS.ARBOLES,
                docId: this.state.selectedProduct.docId
            });

            this.uiService.showToast('Estructura guardada con éxito.', 'success');
            saveBtn.textContent = 'Guardar Cambios';
            saveBtn.classList.remove('animate-pulse');
        } catch (error) {
            console.error("Error guardando el árbol:", error);
            this.uiService.showToast('Error al guardar la estructura.', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios *';
        }
    },

    /**
     * Abre un modal para añadir un nuevo componente al nodo activo.
     */
    _addNode() {
        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
        const activeNode = tree.getActiveNode();

        if (!activeNode) {
            this.uiService.showToast('Por favor, selecciona un elemento en el árbol para añadirle un componente.', 'info');
            return;
        }
        if (!activeNode.isFolder()) {
            this.uiService.showToast('No se pueden añadir componentes a este tipo de elemento.', 'error');
            return;
        }

        this.uiService.openSearchModal({
            title: 'Seleccionar Componente',
            allowedCollections: [this.COLLECTIONS.SUBPRODUCTOS, this.COLLECTIONS.INSUMOS],
            onSelect: (selectedItem, collectionName) => {
                const alreadyExists = activeNode.children && activeNode.children.some(child => child.key === selectedItem.docId);
                if (alreadyExists) {
                    this.uiService.showToast('Este componente ya existe en este nivel.', 'error');
                    return;
                }
                const newNodeData = {
                    title: selectedItem.descripcion || selectedItem.id,
                    key: selectedItem.docId,
                    collection: collectionName,
                    folder: collectionName === this.COLLECTIONS.SUBPRODUCTOS,
                    comentarios: '',
                    cantidad: 1,
                    unidad: selectedItem.unidadMedidaId || 'unidad'
                };
                activeNode.addNode(newNodeData, 'child');
                activeNode.setExpanded(true);
                this._markAsDirty();
            }
        });
    },

    /**
     * Elimina el nodo activo del árbol.
     */
    _removeNode() {
        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
        const activeNode = tree.getActiveNode();

        if (!activeNode) {
            this.uiService.showToast('Por favor, selecciona un elemento para quitarlo.', 'info');
            return;
        }
        if (activeNode.isRootNode()) {
            this.uiService.showToast('No se puede quitar el producto principal.', 'error');
            return;
        }

        this.uiService.showConfirmationModal(
            'Confirmar Eliminación',
            `¿Estás seguro de que quieres quitar "${activeNode.title}" del árbol?`,
            () => {
                activeNode.remove();
                this._markAsDirty();
            }
        );
    },

    /**
     * Aplica el filtro de nivel al árbol.
     */
    _applyFilter(searchTerm) {
        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
        if (!tree || !tree.filterNodes) return;

        const lowerCaseSearch = searchTerm.toLowerCase();

        if (!lowerCaseSearch) {
            tree.clearFilter();
            return;
        }

        tree.filterNodes((node) => {
            const title = node.title.toLowerCase();
            const partNumber = (node.data.id || '').toLowerCase();
            return title.includes(lowerCaseSearch) || partNumber.includes(lowerCaseSearch);
        });
    },

    // --- LÓGICA DE MODAL DE DETALLES (adaptado de databaseViews.js) ---

    async _openDetailModalForItem(collectionName, docId) {
        const modalId = 'sinoptico-detail-modal';
        if (document.getElementById(modalId)) return;

        const modalHTML = `
            <div id="${modalId}-backdrop" class="fixed inset-0 modal-backdrop flex items-center justify-center z-[1055]">
                <div id="${modalId}-content" class="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col animate-scale-in max-h-[90vh]">
                    <div class="p-8 text-center"><div class="loading-spinner"></div><p class="mt-2">Cargando detalles...</p></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();

        const itemData = await this.dataService.getDocById(collectionName, docId);
        if (!itemData) {
            this.uiService.showToast('Error: No se pudo cargar el documento.', 'error');
            document.getElementById(`${modalId}-backdrop`).remove();
            return;
        }

        const contentContainer = document.getElementById(`${modalId}-content`);
        contentContainer.innerHTML = this._generateDetailModalContent(collectionName, itemData);
        lucide.createIcons();

        // Adjuntar event listeners al modal
        contentContainer.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
            document.getElementById(`${modalId}-backdrop`).remove();
        });

        const historyTab = contentContainer.querySelector('[data-tab="history"]');
        historyTab.addEventListener('click', async () => {
            contentContainer.querySelector('.tab-content-container').innerHTML = `<div class="p-6"><div class="loading-spinner mx-auto"></div></div>`;
            const history = await this.dataService.getVersionHistory(collectionName, docId);
            contentContainer.querySelector('.tab-content-container').innerHTML = this._generateHistoryTabContent(history);
            lucide.createIcons();
        });
    },

    _generateDetailModalContent(collectionName, item) {
        const schema = this.schemas[collectionName] || {};
        const allSchemaKeys = Object.keys(schema).filter(k => k !== 'formattingRules' && !schema[k].hidden);

        return `
            <div class="p-6 border-b flex justify-between items-start">
                <div>
                    <p class="text-xs font-semibold text-blue-600 uppercase">${collectionName.slice(0, -1)}</p>
                    <h3 class="text-2xl font-bold text-slate-800 mt-1">${item.descripcion || item.id}</h3>
                </div>
                <button data-action="close-modal" class="btn btn-secondary !p-2" title="Cerrar">
                    <i data-lucide="x" class="h-5 w-5"></i>
                </button>
            </div>
            <div class="border-b border-slate-200">
                <nav class="flex gap-4 px-6 -mb-px">
                    <button data-tab="details" class="py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600">Detalles</button>
                    <button data-tab="history" class="py-4 px-1 border-b-2 font-medium text-sm border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700">Historial</button>
                </nav>
            </div>
            <div class="flex-grow overflow-y-auto custom-scrollbar tab-content-container">
                <div class="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    ${allSchemaKeys.map(key => {
                        const fieldSchema = schema[key] || {};
                        const value = item[key];
                        return `
                        <div>
                            <p class="text-xs font-semibold text-slate-500 uppercase">${fieldSchema.label || key}</p>
                            <div class="mt-1 text-sm text-slate-800">
                                ${this._formatDisplayValue(value, fieldSchema, item)}
                            </div>
                        </div>
                        `}).join('')}
                </div>
            </div>
        `;
    },

    _generateHistoryTabContent(history) {
        if (!history || history.length === 0) {
            return `<div class="p-8 text-center text-slate-500">
                        <i data-lucide="history" class="mx-auto h-12 w-12 text-slate-400 mb-4"></i>
                        <h4 class="font-semibold text-lg">Sin Historial de Versiones</h4>
                        <p>No se han registrado cambios para este documento.</p>
                   </div>`;
        }

        return `<div class="p-6 space-y-3">
            ${history.map(version => `
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 pt-1">
                        <span class="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center" title="${version.savedBy}">
                            <i data-lucide="user" class="w-5 h-5 text-slate-600"></i>
                        </span>
                    </div>
                    <div class="flex-grow bg-white border rounded-lg p-3">
                        <p class="text-sm text-slate-700">
                            Versión guardada por <span class="font-semibold">${version.savedBy.split('@')[0]}</span>
                        </p>
                        <p class="text-xs text-slate-500">${version.savedAt.toDate().toLocaleString('es-AR')}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    _formatDisplayValue(value, fieldSchema, item) {
        if (value === undefined || value === null || value === '') return '<span class="text-slate-400">Sin asignar</span>';
        if (fieldSchema?.type === 'boolean') {
            return value ? '<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>' : '<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">No</span>';
        }
        if (fieldSchema?.type === 'relation' && item[fieldSchema.key]) {
            const relatedDoc = this.app.collectionsById[fieldSchema.collection]?.get(item[fieldSchema.key]);
            const displayValue = relatedDoc ? (relatedDoc.descripcion || relatedDoc.id) : `ID: ${item[fieldSchema.key]}`;
            return `<span class="text-blue-600 font-semibold">${displayValue}</span>`;
        }
        return value;
    },

    // Placeholder for future export functionality if needed
    _exportPdf() {
        this.uiService.showToast('La exportación a PDF no está implementada en esta versión.', 'info');
    }
};
