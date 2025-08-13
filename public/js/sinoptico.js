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
                        <button id="export-pdf-btn" class="btn btn-secondary"><i data-lucide="file-text" class="mr-2 h-4 w-4"></i>Exportar PDF</button>
                        <button id="save-tree-btn" class="btn btn-primary" disabled>Guardar Cambios</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" style="height: calc(100vh - 220px);">
                    <!-- Panel Izquierdo: Editor del Árbol -->
                    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                        <div class="flex-shrink-0">
                            <div class="w-full max-w-sm mb-4">
                                <label for="product-select" class="block text-sm font-medium text-slate-700">Seleccionar Producto</label>
                                <select id="product-select" class="w-full mt-1 p-2 border rounded-md shadow-sm">
                                    <option value="">Cargando productos...</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-2 mb-4">
                                <button id="add-node-btn" class="btn btn-secondary text-sm">Añadir Componente</button>
                                <button id="remove-node-btn" class="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm">Quitar Seleccionado</button>
                            </div>
                        </div>
                        <div id="sinoptico-tree-wrapper" class="flex-grow border rounded-md" style="overflow: auto;">
                            <table id="sinoptico-tree-container" class="fancytree-plain">
                                <colgroup>
                                    <col width="*">
                                    <col width="180px">
                                    <col width="100px">
                                    <col width="80px">
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
                                    <tr style="display:none;"><td colspan="4"></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Derecho: Visualización Gráfica -->
                    <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
                        <div class="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 class="text-lg font-bold text-slate-800">Visualización Gráfica</h3>
                             <div class="flex items-center space-x-2">
                                <span class="text-sm font-medium text-slate-700">Filtrar Nivel:</span>
                                <div id="level-filter-container" class="flex items-center space-x-2">
                                    <label class="inline-flex items-center"><input type="checkbox" name="level-filter" class="level-filter" value="1" checked> <span class="ml-1 text-xs">1</span></label>
                                    <label class="inline-flex items-center"><input type="checkbox" name="level-filter" class="level-filter" value="2" checked> <span class="ml-1 text-xs">2</span></label>
                                    <label class="inline-flex items-center"><input type="checkbox" name="level-filter" class="level-filter" value="3" checked> <span class="ml-1 text-xs">3</span></label>
                                    <label class="inline-flex items-center"><input type="checkbox" name="level-filter" class="level-filter" value="4" checked> <span class="ml-1 text-xs">4+</span></label>
                                </div>
                            </div>
                        </div>
                        <div id="sinoptico-svg-container" class="flex-grow border rounded-lg bg-slate-50/50 flex items-center justify-center overflow-auto">
                           <p class="text-slate-500">Seleccione un producto para ver el diagrama.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
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
            click: (event, data) => {
                if (data.targetType === 'title') {
                    const node = data.node;
                    this._openDetailModalForItem(node.data.collection, node.key);
                }
            },
            renderColumns: (event, data) => {
                const node = data.node;
                const $tdList = jQuery(node.tr).find(">td");

                // Hacer que el título sea un enlace
                const $title = $tdList.eq(0).find('.fancytree-title');
                $title.addClass('text-blue-600 hover:underline cursor-pointer');

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
    // --- LÓGICA DE VISUALIZACIÓN GRÁFICA (adaptado de flowchart.js) ---

    RENDER_CONFIG: {
        SHAPE_SIZE: 60,
        NODE_WIDTH: 250,
        NODE_HEIGHT: 70,
        H_SPACING: 50,
        V_SPACING: 40,
        STROKE_COLOR: '#475569',
        FONT_COLOR: '#1e293b',
        FONT_SIZE: 11,
        TEXT_OFFSET_X: 15,
    },

    NODE_TYPES: {
        [ 'productos' ]: { label: 'Producto', color: '#e0f2fe', shape: 'oval' },
        [ 'subproductos' ]: { label: 'Subproducto', color: '#dcfce7', shape: 'oval' },
        [ 'insumos' ]: { label: 'Insumo', color: '#fff7ed', shape: 'square' },
    },

    _renderVisualTree() {
        const svgContainer = document.getElementById('sinoptico-svg-container');
        if (!svgContainer) return;

        if (!this.state.currentTree || this.state.currentTree.length === 0) {
            svgContainer.innerHTML = `<p class="text-slate-500">No hay datos para mostrar el diagrama.</p>`;
            return;
        }

        try {
            const { nodes, connectors } = this._transformTreeToFlowchartData(this.state.currentTree);
            const layout = this._calculateLayout(nodes, connectors);

            const viewBox = { x: 0, y: 0, width: layout.width, height: layout.height };
            svgContainer.innerHTML = this._renderSvg(layout, viewBox);

        } catch (error) {
            console.error("Error rendering visual tree:", error);
            svgContainer.innerHTML = `<p class="text-red-500">Error al generar el diagrama.</p>`;
        }
    },

    _transformTreeToFlowchartData(treeData) {
        const nodes = [];
        const connectors = [];

        function traverse(treeNodes, parentId = null, level = 0) {
            if (!treeNodes) return;
            treeNodes.forEach(treeNode => {
                const node = {
                    id: treeNode.key,
                    name: treeNode.title || treeNode.key,
                    type: treeNode.collection,
                    level: level,
                    children: [], // Se usará para el layout
                };
                nodes.push(node);

                if (parentId) {
                    connectors.push({ from: parentId, to: node.id });
                }

                if (treeNode.children && treeNode.children.length > 0) {
                    // Llenar los hijos para la lógica de layout
                    node.children = treeNode.children.map(child => ({ id: child.key }));
                    traverse(treeNode.children, node.id, level + 1);
                }
            });
        }

        traverse(treeData);
        return { nodes, connectors };
    },

    _calculateLayout(nodes, connectors) {
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        const V_GAP = this.RENDER_CONFIG.NODE_HEIGHT + this.RENDER_CONFIG.V_SPACING;
        const H_GAP = this.RENDER_CONFIG.NODE_WIDTH + this.RENDER_CONFIG.H_SPACING;

        let levelCounts = {};
        nodes.forEach(node => {
            levelCounts[node.level] = (levelCounts[node.level] || 0) + 1;
        });

        let levelYPositions = {};
        let currentY = this.RENDER_CONFIG.SHAPE_SIZE;
        for (let i = 0; i < Object.keys(levelCounts).length; i++) {
            levelYPositions[i] = currentY;
            currentY += V_GAP;
        }

        let layoutNodes = new Map();
        let maxWidth = 0;
        let maxHeight = 0;

        function positionNode(nodeId, x, y) {
            const node = nodeMap.get(nodeId);
            if (!node || layoutNodes.has(nodeId)) return;

            layoutNodes.set(nodeId, { ...node, pos: { x, y } });
            maxWidth = Math.max(maxWidth, x + H_GAP);
            maxHeight = Math.max(maxHeight, y + V_GAP);

            const children = node.children || [];
            const totalWidth = children.length * H_GAP - this.RENDER_CONFIG.H_SPACING;
            let startX = x - totalWidth / 2 + (this.RENDER_CONFIG.NODE_WIDTH / 2);

            children.forEach(childRef => {
                positionNode.call(this, childRef.id, startX, y + V_GAP);
                startX += H_GAP;
            });
        }

        const root = nodes.find(n => n.level === 0);
        if (root) {
            positionNode.call(this, root.id, 0, this.RENDER_CONFIG.SHAPE_SIZE);
        }

        return { nodes: layoutNodes, connectors, width: maxWidth, height: maxHeight };
    },

    _renderSvg(layout, viewBox) {
        const { nodes, connectors } = layout;
        let svgElements = '';
        const S = this.RENDER_CONFIG.SHAPE_SIZE;

        const nodeTypeColors = this.NODE_TYPES;
        let defs = Object.entries(nodeTypeColors).map(([key, { color }]) => {
            const lightColor = tinycolor(color).lighten(10).toString();
            return `<linearGradient id="grad-${key}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${lightColor};" /><stop offset="100%" style="stop-color:${color};" /></linearGradient>`;
        }).join('');

        connectors.forEach(conn => {
            const fromNode = nodes.get(conn.from);
            const toNode = nodes.get(conn.to);
            if (!fromNode || !toNode) return;

            const fromCenterX = fromNode.pos.x + this.RENDER_CONFIG.NODE_WIDTH / 2;
            const toCenterX = toNode.pos.x + this.RENDER_CONFIG.NODE_WIDTH / 2;

            const pathData = `M ${fromCenterX} ${fromNode.pos.y + this.RENDER_CONFIG.NODE_HEIGHT} V ${toNode.pos.y}`;
            svgElements += this._svgConnector(pathData);
        });

        nodes.forEach(node => {
            svgElements += this._svgNode(node);
        });

        return this._svgContainer(svgElements, defs, viewBox);
    },

    _svgContainer(content, defs, viewBox) {
        return `
            <svg width="100%" height="100%" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
                <defs>
                    ${defs}
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="${this.RENDER_CONFIG.STROKE_COLOR}"></path>
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

    _svgNode(node) {
        const typeInfo = this.NODE_TYPES[node.type] || { color: '#e2e8f0', shape: 'rect' };
        const { x, y } = node.pos;
        const W = this.RENDER_CONFIG.NODE_WIDTH;
        const H = this.RENDER_CONFIG.NODE_HEIGHT;
        const fill = `url(#grad-${node.type})`;

        let shapeSvg = `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="10" ry="10" fill="${fill}" stroke="${this.RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" />`;

        const textToRender = node.name || '';
        const words = textToRender.split(' ');
        let lines = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            if (currentLine.length + words[i].length < 25) {
                currentLine += ` ${words[i]}`;
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);

        const lineHeight = this.RENDER_CONFIG.FONT_SIZE * 1.3;
        const textYStart = y + H / 2 - ((lines.length - 1) * lineHeight / 2);

        const textSvg = lines.map((line, i) =>
            `<tspan x="${x + W/2}" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`
        ).join('');

        return `<g class="svg-node" data-id="${node.id}" filter="url(#dropshadow)">
            ${shapeSvg}
            <text y="${textYStart}" font-size="${this.RENDER_CONFIG.FONT_SIZE}" fill="${this.RENDER_CONFIG.FONT_COLOR}" text-anchor="middle" dominant-baseline="central">
                ${textSvg}
            </text>
        </g>`;
    },

    _svgConnector(pathData) {
        return `<path d="${pathData}" stroke="${this.RENDER_CONFIG.STROKE_COLOR}" stroke-width="1.5" fill="none" marker-end="url(#arrowhead)"/>`;
    },

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
        const exportPdfBtn = document.getElementById('export-pdf-btn');

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
        const exportHandler = () => this._exportPdf();

        productSelect.addEventListener('change', changeHandler);
        saveBtn.addEventListener('click', saveHandler);
        addBtn.addEventListener('click', addHandler);
        removeBtn.addEventListener('click', removeHandler);
        filterContainer.addEventListener('change', filterHandler);
        exportPdfBtn.addEventListener('click', exportHandler);

        this.state.cleanupFunctions.push(() => {
            productSelect.removeEventListener('change', changeHandler);
            saveBtn.removeEventListener('click', saveHandler);
            addBtn.removeEventListener('click', addHandler);
            removeBtn.removeEventListener('click', removeHandler);
            filterContainer.removeEventListener('change', filterHandler);
            exportPdfBtn.removeEventListener('click', exportHandler);
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
                this._markAsDirty(); // Habilitar el guardado para la nueva estructura
            }

            const richTreeData = this._enrichTreeData(rawTreeData);
            this._initTree(richTreeData);

            // Renderizar la visualización gráfica
            this._renderVisualTree();

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
    _applyFilter() {
        const tree = $.ui.fancytree.getTree('#sinoptico-tree-container');
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

    // --- LÓGICA DE EXPORTACIÓN A PDF ---

    async _exportPdf() {
        if (!this.state.selectedProduct) {
            this.uiService.showToast('Por favor, seleccione un producto para exportar.', 'error');
            return;
        }
        this.uiService.showToast('Generando PDF, por favor espere...', 'info');

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const logoDataUrl = await this._loadImageAsDataUrl('./logo.png').catch(() => null);

            this._addPdfCoverPage(doc, logoDataUrl);

            const svgContainer = document.getElementById('sinoptico-svg-container');
            const svgElement = svgContainer.querySelector('svg');
            if (svgElement) {
                doc.addPage('a4', 'l'); // Landscape for the diagram
                const layout = this._calculateLayout(...Object.values(this._transformTreeToFlowchartData(this.state.currentTree)));
                const canvas = await this._svgStringToCanvas(svgElement.outerHTML, layout.width, layout.height);
                const imgData = canvas.toDataURL('image/png');

                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                const margin = 40;

                const availableWidth = pdfWidth - (margin * 2);
                const availableHeight = pdfHeight - (margin * 2) - 60; // Space for header/footer

                const ratio = canvas.width / canvas.height;
                let imgWidth = availableWidth;
                let imgHeight = imgWidth / ratio;

                if (imgHeight > availableHeight) {
                    imgHeight = availableHeight;
                    imgWidth = imgHeight * ratio;
                }

                const x = (pdfWidth - imgWidth) / 2;
                const y = (pdfHeight - imgHeight) / 2 + 20;

                doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            }

            await this._addPdfHeaderAndFooter(doc, logoDataUrl);

            doc.save(`Sinoptico_${this.state.selectedProduct.descripcion.replace(/\s/g, '_')}.pdf`);
            this.uiService.showToast('PDF generado con éxito.', 'success');

        } catch (error) {
            console.error("Error al exportar PDF:", error);
            this.uiService.showToast(`Ocurrió un error al generar el PDF: ${error.message}`, "error");
        }
    },

    _addPdfCoverPage(doc, logoDataUrl) {
        const margin = 40;
        const pageWidth = doc.internal.pageSize.width;
        const producto = this.state.selectedProduct;
        const cliente = this.app.collectionsById[this.COLLECTIONS.CLIENTES].get(producto.clienteId)?.descripcion || 'N/A';

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#1e293b');
        doc.text('Carátula del Sinóptico de Producto', margin, 100);

        const infoData = [
            ['Producto:', producto.descripcion || ''],
            ['Código:', producto.id || ''],
            ['Cliente:', cliente],
            ['Fecha de Generación:', new Date().toLocaleDateString('es-AR')],
        ];

        doc.autoTable({
            startY: 120,
            head: [['Campo', 'Valor']],
            body: infoData,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 8, lineColor: '#cbd5e1', lineWidth: 0.5 },
            headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 150 } }
        });
    },

    async _addPdfHeaderAndFooter(doc, logoDataUrl) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 40;

            if (logoDataUrl) {
                const imgProps = doc.getImageProperties(logoDataUrl);
                const imgHeight = 30;
                const imgWidth = (imgProps.width * imgHeight) / imgProps.height;
                doc.addImage(logoDataUrl, 'PNG', margin, 20, imgWidth, imgHeight);
            }

            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1e293b');
            doc.setFontSize(16);
            doc.text('Sinóptico de Producto', pageWidth - margin, 40, { align: 'right' });

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.line(margin, 60, pageWidth - margin, 60);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - margin + 20, { align: 'right' });
        }
    },

    _loadImageAsDataUrl(url) {
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
    },

    _svgStringToCanvas(svgString, width, height) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 2;
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
};
