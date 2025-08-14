// =================================================================================
// --- MÓDULO SINÓPTICO DE PRODUCTO (Versión simplificada con Mermaid.js) ---
// =================================================================================

export const sinopticoModule = {
    // Referencias a servicios y estado de la app
    app: null,
    db: null,
    uiService: null,
    dataService: null,
    firestore: null,
    COLLECTIONS: null,

    // Estado local del módulo
    state: {
        selectedProduct: null,
        cleanupFunctions: [],
    },

    /**
     * Inicializa el módulo, guardando referencias a los servicios de la app.
     */
    init(dependencies) {
        this.app = dependencies.appState;
        this.db = dependencies.db;
        this.uiService = dependencies.uiService;
        this.dataService = dependencies.dataService;
        this.firestore = dependencies.firestore;
        this.COLLECTIONS = dependencies.COLLECTIONS;
    },

    /**
     * Renderiza el HTML estático de la vista del sinóptico.
     */
    renderLayout(container) {
        container.innerHTML = `
            <div class="animate-fade-in-up">
                <!-- Encabezado Principal -->
                <div class="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <div>
                        <h2 class="text-3xl font-extrabold text-slate-800">Sinóptico de Producto</h2>
                        <p class="text-slate-500 mt-1">Visualiza la estructura jerárquica de los productos.</p>
                    </div>
                </div>

                <!-- Panel de Controles -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div class="max-w-md">
                        <label for="product-select" class="block text-sm font-medium text-slate-700">Seleccionar Producto Principal</label>
                        <select id="product-select" class="w-full mt-1 p-2 border rounded-md shadow-sm">
                            <option value="">Cargando productos...</option>
                        </select>
                    </div>
                </div>

                <!-- Contenedor del Diagrama -->
                <div id="sinoptico-diagram-wrapper" class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[600px] flex items-center justify-center">
                    <div id="sinoptico-diagram-container" class="w-full">
                       <p class="p-8 text-center text-slate-500">Seleccione un producto para comenzar.</p>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
        this._populateProductSelector();
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
            products.sort((a, b) => a.id.localeCompare(b.id)).forEach(p => {
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
     */
    runLogic(container) {
        this.cleanup();
        this.renderLayout(container);

        const productSelect = document.getElementById('product-select');
        const changeHandler = () => {
            const productId = productSelect.value;
            if (productId) {
                this._loadAndRenderGraph(productId);
            } else {
                const diagramContainer = document.getElementById('sinoptico-diagram-container');
                diagramContainer.innerHTML = '<p class="p-8 text-center text-slate-500">Seleccione un producto para comenzar.</p>';
            }
        };

        productSelect.addEventListener('change', changeHandler);
        this.state.cleanupFunctions.push(() => {
            productSelect.removeEventListener('change', changeHandler);
        });

        return this.cleanup.bind(this);
    },

    /**
     * Carga los datos del árbol y renderiza el gráfico Mermaid.
     * @param {string} productId - El ID del documento del producto.
     */
    async _loadAndRenderGraph(productId) {
        this.state.selectedProduct = this.app.collectionsById[this.COLLECTIONS.PRODUCTOS].get(productId);
        if (!this.state.selectedProduct) {
            this.uiService.showToast('Error: Producto no encontrado.', 'error');
            return;
        }

        const diagramContainer = document.getElementById('sinoptico-diagram-container');
        diagramContainer.innerHTML = `
            <div class="p-8 text-center text-slate-500">
                <div class="loading-spinner mx-auto"></div>
                <p class="mt-2">Cargando estructura y generando diagrama...</p>
            </div>`;

        try {
            const treeDocRef = this.firestore.doc(this.db, this.COLLECTIONS.ARBOLES, productId);
            const treeDocSnap = await this.firestore.getDoc(treeDocRef);

            let rawTreeData;
            if (treeDocSnap.exists() && treeDocSnap.data().nodes) {
                rawTreeData = treeDocSnap.data().nodes;
            } else {
                // Si no hay árbol, muestra solo el nodo raíz.
                rawTreeData = [{
                    key: this.state.selectedProduct.docId,
                    collection: this.COLLECTIONS.PRODUCTOS,
                    children: []
                }];
            }

            const richTreeData = this._enrichTreeData(rawTreeData);
            const mermaidString = this._generateMermaidGraph(richTreeData);

            // Renderizar con Mermaid
            const { svg } = await window.mermaid.render('mermaid-graph', mermaidString);
            diagramContainer.innerHTML = svg;

        } catch (error) {
            console.error("Error al renderizar el diagrama sinóptico:", error);
            this.uiService.showToast('Error al generar el diagrama.', 'error');
            diagramContainer.innerHTML = `
                <div class="p-8 text-center text-red-500">
                    <i data-lucide="alert-triangle" class="mx-auto h-12 w-12 mb-4"></i>
                    <h4 class="font-semibold text-lg">No se pudo generar el diagrama.</h4>
                    <p class="text-sm">${error.message}</p>
                </div>`;
            lucide.createIcons();
        }
    },

    /**
     * Enriquece los datos del árbol con información de las colecciones cacheadas.
     */
    _enrichTreeData(nodes) {
        return nodes.map(node => {
            const doc = this.app.collectionsById[node.collection]?.get(node.key);
            node.title = doc ? `${doc.id} - ${doc.descripcion}` : `ID: ${node.key} (No encontrado)`;
            node.doc = doc; // Adjuntar el documento completo para más detalles si es necesario

            if (node.children && node.children.length > 0) {
                this._enrichTreeData(node.children);
            }
            return node;
        });
    },

    /**
     * Genera la definición del gráfico de Mermaid a partir de los datos del árbol.
     * @param {object[]} treeData - Los datos del árbol enriquecidos.
     * @returns {string} La definición del gráfico en formato de texto de Mermaid.
     */
    _generateMermaidGraph(treeData) {
        let graphString = 'graph TD;\n';
        let nodes = new Set();
        let links = [];

        function processNode(node, parentKey = null) {
            // Reemplazar caracteres problemáticos para el ID de Mermaid
            const safeKey = (node.key || 'undefined').replace(/[^a-zA-Z0-9_]/g, '');

            if (!nodes.has(safeKey)) {
                nodes.add(safeKey);
                const text = `${node.title.replace(/"/g, '#quot;')} <br/> <span class='text-xs'>Qty: ${node.cantidad || 1}</span>`;

                // Aplicar diferentes estilos por tipo de colección
                let style = 'default';
                if (node.collection === 'productos') style = 'product';
                if (node.collection === 'subproductos') style = 'subproduct';
                if (node.collection === 'insumos') style = 'insumo';

                graphString += `    ${safeKey}("${text}");\n`;
                graphString += `    class ${safeKey} ${style};\n`;
            }

            if (parentKey) {
                const safeParentKey = parentKey.replace(/[^a-zA-Z0-9_]/g, '');
                links.push(`    ${safeParentKey} --> ${safeKey}`);
            }

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child, node.key));
            }
        }

        treeData.forEach(node => processNode(node));

        graphString += links.join(';\n') + ';\n';

        // Definiciones de estilo
        graphString += `
            classDef default fill:#f8fafc,stroke:#e2e8f0,stroke-width:2px,color:#334155;
            classDef product fill:#eef2ff,stroke:#6366f1,stroke-width:2px,color:#3730a3,font-weight:bold;
            classDef subproduct fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#15803d;
            classDef insumo fill:#fffbeb,stroke:#f59e0b,stroke-width:2px,color:#b45309;
        `;

        return graphString;
    },

    /**
     * Limpia los listeners de eventos y el estado local del módulo.
     */
    cleanup() {
        this.state.cleanupFunctions.forEach(func => func());
        this.state.cleanupFunctions = [];
        this.state.selectedProduct = null;
    }
};
