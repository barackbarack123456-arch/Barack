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

                <!-- Contenedor del Árbol/Tabla -->
                <div id="sinoptico-tree-wrapper" class="bg-white rounded-xl shadow-sm border border-slate-200" style="height: calc(100vh - 350px); overflow: auto;">
                    <table id="sinoptico-tree-container">
                        <colgroup>
                            <col width="*">
                            <col width="120px">
                            <col width="100px">
                            <col width="180px">
                            <col width="150px">
                        </colgroup>
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer sortable-header" data-sort-key="title">Part Number / Description</th>
                                <th class="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer sortable-header" data-sort-key="level">Level</th>
                                <th class="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer sortable-header" data-sort-key="cantidad">Qty per Piece</th>
                                <th class="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer sortable-header" data-sort-key="comentarios">Comments</th>
                                <th class="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer sortable-header" data-sort-key="collection">Part Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="5" class="p-8 text-center text-slate-500">Seleccione un producto para comenzar.</td></tr>
                        </tbody>
                    </table>
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
            extensions: ["table", "dnd5", "edit", "filter"],
            source: treeData,
            table: {
                indentation: 20,
                nodeColumnIdx: 0,
                checkboxColumnIdx: null,
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
            renderColumns: (event, data) => {
                const node = data.node;
                const $tdList = jQuery(node.tr).find(">td");

                // Columna 0: Título (con icono)
                const $iconSpan = $tdList.eq(0).find('.fancytree-icon');
                const iconMap = {
                    'productos': 'package',
                    'subproductos': 'box',
                    'insumos': 'beaker'
                };
                const iconName = iconMap[node.data.collection] || 'file-text';
                $iconSpan.html(`<i data-lucide="${iconName}" class="inline-block h-4 w-4 mr-2 text-slate-500 align-middle"></i>`);

                const $title = $tdList.eq(0).find('.fancytree-title');
                $title.addClass('text-slate-800 font-semibold align-middle');

                // Columna 1: Nivel
                $tdList.eq(1).text(node.getLevel()).addClass('text-center');

                // Columna 2: Cantidad por pieza
                const $qtyTd = $tdList.eq(2).text(node.data.cantidad || 1).addClass('text-center');

                // Columna 3: Comentarios
                const $commentsTd = $tdList.eq(3).text(node.data.comentarios || '');

                // Columna 4: Tipo de Parte
                const partType = node.data.collection.replace(/s$/, ''); // 'productos' -> 'producto'
                $tdList.eq(4).html(`<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-800">${partType}</span>`).addClass('text-center');

                // Hacer columnas editables si estamos en modo edición
                if (this.state.isEditMode) {
                    this._setupEditable($qtyTd, node, 'cantidad', true);
                    this._setupEditable($commentsTd, node, 'comentarios', false);
                }
            }
        });
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

    _handleSort(newSortKey) {
        if (this.state.sortKey === newSortKey) {
            this.state.sortDir = this.state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortKey = newSortKey;
            this.state.sortDir = 'asc';
        }

        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
        if (!tree || !tree.rootNode) return;

        const cmp = (a, b) => {
            let valA, valB;

            switch (this.state.sortKey) {
                case 'level':
                    valA = a.getLevel();
                    valB = b.getLevel();
                    break;
                case 'title':
                    valA = a.title;
                    valB = b.title;
                    break;
                default:
                    valA = a.data[this.state.sortKey];
                    valB = b.data[this.state.sortKey];
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
        };

        tree.rootNode.sortChildren(cmp, true);

        if (this.state.sortDir === 'desc') {
            const topLevelNodes = tree.rootNode.children.slice(0);
            topLevelNodes.reverse();
            tree.rootNode.children = topLevelNodes;
            tree.render();
        }


        this._updateSortVisuals();
    },

    _updateSortVisuals() {
        const headers = document.querySelectorAll('#sinoptico-tree-container .sortable-header');
        headers.forEach(th => {
            const indicator = th.querySelector('.sort-indicator');
            if (indicator) indicator.remove();

            if (th.dataset.sortKey === this.state.sortKey) {
                const iconName = this.state.sortDir === 'asc' ? 'arrow-up' : 'arrow-down';
                th.insertAdjacentHTML('beforeend', ` <span class="sort-indicator"><i data-lucide="${iconName}" class="h-4 w-4 inline-block ml-1 text-blue-600"></i></span>`);
            }
        });
        lucide.createIcons();
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
        this._updateSortVisuals();

        // Limpiar el contenido del arbol inicial
        const treeContainer = document.getElementById('sinoptico-tree-container').querySelector('tbody');
        treeContainer.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</td></tr>';

        // Configurar el event listener para el selector de producto
        const productSelect = document.getElementById('product-select');
        const saveBtn = document.getElementById('save-tree-btn');
        const addBtn = document.getElementById('add-node-btn');
        const removeBtn = document.getElementById('remove-node-btn');
        const searchInput = document.getElementById('sinoptico-search');
        const exportPdfBtn = document.getElementById('export-pdf-btn');
        const toggleEditBtn = document.getElementById('toggle-edit-mode-btn');
        const tableHeaders = document.querySelectorAll('#sinoptico-tree-container .sortable-header');

        const changeHandler = () => {
            const productId = productSelect.value;
            if (productId) {
                this._loadTreeForProduct(productId);
            } else {
                this._initTree([]);
                treeContainer.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</td></tr>';
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
        const sortHandler = (e) => {
            const sortKey = e.currentTarget.dataset.sortKey;
            if (sortKey) this._handleSort(sortKey);
        };

        productSelect.addEventListener('change', changeHandler);
        saveBtn.addEventListener('click', saveHandler);
        addBtn.addEventListener('click', addHandler);
        removeBtn.addEventListener('click', removeHandler);
        searchInput.addEventListener('input', searchHandler);
        exportPdfBtn.addEventListener('click', exportHandler);
        toggleEditBtn.addEventListener('click', toggleEditHandler);
        tableHeaders.forEach(th => th.addEventListener('click', sortHandler));

        this.state.cleanupFunctions.push(() => {
            productSelect.removeEventListener('change', changeHandler);
            saveBtn.removeEventListener('click', saveHandler);
            addBtn.removeEventListener('click', addHandler);
            removeBtn.removeEventListener('click', removeHandler);
            searchInput.removeEventListener('input', searchHandler);
            exportPdfBtn.removeEventListener('click', exportHandler);
            toggleEditBtn.removeEventListener('click', toggleEditHandler);
            tableHeaders.forEach(th => th.removeEventListener('click', sortHandler));
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

        const treeContainer = document.getElementById('sinoptico-tree-container').querySelector('tbody');
        treeContainer.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500"><div class="loading-spinner mx-auto"></div><p class="mt-2">Cargando estructura...</p></div></td></tr>';

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

            // Importante: no crear un `richNode` separado, modificar el original
            // para que la referencia se mantenga en this.state.currentTree
            node.title = doc ? (doc.descripcion || doc.id) : `Elemento no encontrado (ID: ${node.key})`;
            if (!doc) {
                node.extraClasses = "fancytree-error"; // Clase para estilizar nodos rotos
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
