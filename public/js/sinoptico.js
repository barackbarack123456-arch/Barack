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
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-3xl font-extrabold text-slate-800">Sinóptico de Producto</h2>
                        <p class="text-slate-500 mt-1">Construye y visualiza la estructura jerárquica de los productos.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="add-node-btn" class="btn btn-secondary">Añadir Componente</button>
                        <button id="remove-node-btn" class="btn bg-red-100 text-red-700 hover:bg-red-200">Quitar</button>
                        <button id="save-tree-btn" class="btn btn-primary" disabled>Guardar Cambios</button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div class="mb-4 flex items-center justify-between">
                        <div class="w-full max-w-sm">
                            <label for="product-select" class="block text-sm font-medium text-slate-700">Seleccionar Producto</label>
                            <select id="product-select" class="w-full mt-1 p-2 border rounded-md shadow-sm">
                                <option value="">Cargando productos...</option>
                            </select>
                        </div>
                        <div id="level-filter-container" class="flex items-center space-x-4">
                            <span class="text-sm font-medium text-slate-700">Filtrar por Nivel:</span>
                            <div class="flex items-center space-x-3">
                                <label class="inline-flex items-center"><input type="checkbox" class="level-filter" value="1" checked> <span class="ml-1">1</span></label>
                                <label class="inline-flex items-center"><input type="checkbox" class="level-filter" value="2" checked> <span class="ml-1">2</span></label>
                                <label class="inline-flex items-center"><input type="checkbox" class="level-filter" value="3" checked> <span class="ml-1">3</span></label>
                                <label class="inline-flex items-center"><input type="checkbox" class="level-filter" value="4" checked> <span class="ml-1">4+</span></label>
                            </div>
                        </div>
                    </div>
                    <div id="sinoptico-tree-wrapper" class="border rounded-md" style="height: 600px; overflow: auto;">
                        <table id="sinoptico-tree-container" class="fancytree-plain">
                            <colgroup>
                                <col width="*">
                                <col width="250px">
                                <col width="150px">
                                <col width="100px">
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Nombre / Descripción</th>
                                    <th>Comentarios</th>
                                    <th>Cantidad</th>
                                    <th>Unidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Fancytree llenará este tbody -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Cargar los productos en el dropdown
        this._populateProductSelector();
    },

    /**
     * Inicializa el árbol de Fancytree con los datos proporcionados.
     * @param {object[]} treeData - Los datos para el árbol.
     */
    _initTree(treeData) {
        const treeContainer = document.getElementById('sinoptico-tree-container');
        if (!treeContainer) return;

        // Fancytree depende de jQuery, que se asume que está cargado desde el CDN.
        if (typeof jQuery === 'undefined' || typeof jQuery.fn.fancytree !== 'function') {
            this.uiService.showToast('Error: La librería Fancytree no se cargó correctamente.', 'error');
            treeContainer.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-red-500">Error crítico: Fancytree no está disponible.</td></tr>';
            return;
        }

        // Destruir cualquier instancia anterior
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
                dragStart: (node, data) => {
                    if (node.isRootNode()) {
                        this.uiService.showToast("El producto principal no se puede mover.", "info");
                        return false;
                    }
                    return true;
                },
                dragEnter: (node, data) => {
                    if (!node.isFolder()) {
                        return ["before", "after"];
                    }
                    return ["before", "after", "over"];
                },
                dragDrop: (node, data) => {
                    data.otherNode.moveTo(node, data.hitMode);
                    this._markAsDirty();
                }
            },
            filter: {
                mode: "hide",
                autoExpand: true,
            },
            renderColumns: (event, data) => {
                const node = data.node;
                const $tdList = jQuery(node.tr).find(">td");

                const setupEditable = (td, key, isNumeric = false) => {
                    const initialValue = node.data[key] || (isNumeric ? 0 : "");
                    td.text(initialValue).attr('contenteditable', true);

                    // Prevenir que el Enter cree nuevas líneas
                    td.on('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur(); // Salir del modo de edición
                        }
                    });

                    td.on('blur', (e) => {
                        let newValue = jQuery(e.target).text();
                        if (isNumeric) {
                            newValue = parseFloat(newValue) || 0;
                        }

                        if (node.data[key] !== newValue) {
                            node.data[key] = newValue;
                            this._markAsDirty();
                        }
                    });
                };

                setupEditable($tdList.eq(1), 'comentarios');
                setupEditable($tdList.eq(2), 'cantidad', true);
                setupEditable($tdList.eq(3), 'unidad');
            }
        });

        // Aplicar el filtro inicial
        this._applyFilter();
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
        const treeContainer = document.getElementById('sinoptico-tree-container').querySelector('tbody');
        treeContainer.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</td></tr>';

        // Configurar el event listener para el selector de producto
        const productSelect = document.getElementById('product-select');
        const saveBtn = document.getElementById('save-tree-btn');
        const addBtn = document.getElementById('add-node-btn');
        const removeBtn = document.getElementById('remove-node-btn');
        const filterContainer = document.getElementById('level-filter-container');

        const changeHandler = () => {
            const productId = productSelect.value;
            if (productId) {
                this._loadTreeForProduct(productId);
            } else {
                this._initTree([]);
                treeContainer.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-500">Por favor, selecciona un producto para ver su sinóptico.</td></tr>';
                saveBtn.disabled = true;
            }
        };
        const saveHandler = () => this._saveTree();
        const addHandler = () => this._addNode();
        const removeHandler = () => this._removeNode();
        const filterHandler = () => this._applyFilter();

        productSelect.addEventListener('change', changeHandler);
        saveBtn.addEventListener('click', saveHandler);
        addBtn.addEventListener('click', addHandler);
        removeBtn.addEventListener('click', removeHandler);
        filterContainer.addEventListener('change', filterHandler);

        this.state.cleanupFunctions.push(() => {
            productSelect.removeEventListener('change', changeHandler);
            saveBtn.removeEventListener('click', saveHandler);
            addBtn.removeEventListener('click', addHandler);
            removeBtn.removeEventListener('click', removeHandler);
            filterContainer.removeEventListener('change', filterHandler);
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
        treeContainer.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-500"><div class="loading-spinner mx-auto"></div><p class="mt-2">Cargando estructura...</p></div></td></tr>';

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
            }

            const richTreeData = this._enrichTreeData(rawTreeData);
            this._initTree(richTreeData);

        } catch (error) {
            console.error("Error cargando el árbol sinóptico:", error);
            this.uiService.showToast('Error al cargar la estructura del producto.', 'error');
            treeContainer.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-red-500">No se pudo cargar la estructura. Intente de nuevo.</td></tr>';
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

            const richNode = { ...node };
            richNode.title = doc ? (doc.descripcion || doc.id) : `Elemento no encontrado (ID: ${node.key})`;
            if (!doc) {
                richNode.extraClasses = "fancytree-error"; // Clase para estilizar nodos rotos
            }

            if (node.children && node.children.length > 0) {
                richNode.children = this._enrichTreeData(node.children);
            }
            return richNode;
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

        const tree = jQuery('#sinoptico-tree-container').fancytree('getTree');
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
        const tree = jQuery('#sinoptico-tree-container').fancytree('getTree');
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
        const tree = jQuery('#sinoptico-tree-container').fancytree('getTree');
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
    _applyFilter() {
        const tree = jQuery('#sinoptico-tree-container').fancytree('getTree');
        if (!tree || !tree.filterNodes) return;

        const checkedLevels = Array.from(document.querySelectorAll('.level-filter:checked')).map(cb => parseInt(cb.value, 10));

        if (checkedLevels.length === 4) { // Si todos están marcados, quitar el filtro
            tree.clearFilter();
            return;
        }

        tree.filterNodes((node) => {
            let level = node.getLevel();
            if (level === 0) return true; // Siempre mostrar la raíz (aunque no tiene nivel 0)

            let levelToCheck = level >= 4 ? 4 : level;
            return checkedLevels.includes(levelToCheck);
        });
    }
};
