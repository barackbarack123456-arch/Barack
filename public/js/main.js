// =================================================================================
// --- MÓDULO PRINCIPAL UNIFICADO (main.js) ---
//
// --- MEJORAS APLICADAS (VERSIÓN 41) ---
// 1.  **BUSCADOR MULTI-COLECCIÓN:** La función `uiService.openSearchModal` ahora
//     acepta un array `allowedCollections`. Si se proporciona, buscará en todas
//     las colecciones especificadas y mostrará los resultados agrupados por tipo,
//     lo que es esencial para la nueva lógica de `sinoptico.js`.
// =================================================================================

// --- Importaciones de Módulos de Vista ---
import { sinopticoModule } from './sinoptico.js';
import { flowchartModule } from './flowchart.js';
import { databaseViewsModule } from './databaseViews.js';
import { usuariosModule } from './usuarios.js';
import { actividadModule } from './actividad.js';
import { dashboardModule } from './dashboard.js';

// --- Importaciones de Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    serverTimestamp,
    deleteField
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// =================================================================================
// --- 1. CONFIGURACIÓN E INICIALIZACIÓN ---
// =================================================================================

// La configuración de Firebase ahora se carga a través de /__/firebase/init.js
// Esto es más seguro y utiliza la configuración del proyecto de Firebase enlazado.
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const firestoreFunctions = {
    collection, onSnapshot, doc, setDoc, getDoc, deleteDoc, query, where, getDocs,
    addDoc, updateDoc, orderBy, limit, startAfter, getCountFromServer, serverTimestamp, deleteField
};

// =================================================================================
// --- 2. ESTADO GLOBAL, CONSTANTES, SCHEMAS Y DOM ---
// =================================================================================

const appState = {
    currentView: 'dashboard',
    currentViewPayload: {},
    currentUser: null,
    currentViewCleanup: null,
    isAppInitialized: false,
    initialDataLoaded: false,
    collections: {},
    collectionsById: {},
    unsubscribeListeners: [],
};

const COLLECTIONS = {
    USUARIOS: 'usuarios',
    PRODUCTOS: 'productos',
    SUBPRODUCTOS: 'subproductos',
    INSUMOS: 'insumos',
    CLIENTES: 'clientes',
    PROVEEDORES: 'proveedores',
    UNIDADES: 'unidades',
    PROCESOS: 'procesos',
    PROYECTOS: 'proyectos',
    ARBOLES: 'arboles',
    FLUJOGRAMAS: 'flujogramas',
    ACTIVITY_LOG: 'activity_log'
};

const dom = {
    appView: document.getElementById('app-view'),
    authContainer: document.getElementById('auth-container'),
    loadingOverlay: document.getElementById('loading-overlay'),
    viewBodyContainer: document.getElementById('view-body-container'),
    modalContainer: document.getElementById('modal-container'),
    toastContainer: document.getElementById('toast-container'),
    userMenuContainer: document.getElementById('user-menu-container'),
};

const schemas = {
    clientes: {
        id: { label: 'Código Cliente', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Razón Social', type: 'text', required: true },
        email: { label: 'Email', type: 'email' },
        logoUrl: { label: 'URL del Logo', type: 'text' },
    },
    productos: {
        id: { label: 'Número de Pieza', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text', required: true },
        imageUrl: { label: 'URL de Imagen', type: 'text' },
        clienteId: { label: 'Cliente', type: 'relation', collection: 'clientes', required: true },
        proyectoId: { label: 'Proyecto', type: 'relation', collection: 'proyectos' },
        version: { label: 'Versión', type: 'text' },
        piezasPorVehiculo: { label: 'Piezas por Vehículo', type: 'number' },
        site: { label: 'LC Site / KD', type: 'select', options: ['BARACK', 'KD'] },
        aspecto: { label: 'Aspecto (Y/N)', type: 'boolean' },
        isActivo: { label: 'Activo', type: 'boolean' },
        formattingRules: [{ key: 'isActivo', operator: 'equals', value: false, class: 'bg-red-50 text-red-900 hover:bg-red-100' }]
    },
    insumos: {
        id: { label: 'Número de Pieza', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text', required: true },
        imageUrl: { label: 'URL de Imagen', type: 'text' },
        proveedorId: { label: 'Proveedor', type: 'relation', collection: 'proveedores' },
        materialComponente: { label: 'Material del Componente', type: 'text' },
        color: { label: 'Color', type: 'text' },
        materiaPrimaBase: { label: 'Materia Prima Base', type: 'text' },
        proveedorMateriaPrimaId: { label: 'Proveedor Materia Prima', type: 'relation', collection: 'proveedores' },
        unidadMedidaId: { label: 'Unidad', type: 'relation', collection: 'unidades', field: 'id' },
    },
    subproductos: {
        id: { label: 'Número de Pieza', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text', required: true },
        imageUrl: { label: 'URL de Imagen', type: 'text' },
        procesoId: { label: 'Proceso', type: 'relation', collection: 'procesos' },
        materialComponente: { label: 'Material del Componente', type: 'text' },
        color: { label: 'Color', type: 'text' },
        materiaPrimaBase: { label: 'Materia Prima Base', type: 'text' },
        proveedorMateriaPrimaId: { label: 'Proveedor Materia Prima', type: 'relation', collection: 'proveedores' },
        unidadMedidaId: { label: 'Unidad', type: 'relation', collection: 'unidades', field: 'id' },
    },
    proveedores: {
        id: { label: 'Código Proveedor', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Razón Social', type: 'text', required: true },
        contacto: { label: 'Contacto', type: 'text' },
        telefono: { label: 'Teléfono', type: 'text' },
    },
    unidades: {
        id: { label: 'Unidad', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text' },
    },
    procesos: {
        id: { label: 'Código Proceso', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text', required: true },
    },
    proyectos: {
        id: { label: 'Código Proyecto', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text', required: true },
        fechaEmision: { label: 'Fecha de Emisión', type: 'date' },
        fechaRevision: { label: 'Fecha de Revisión', type: 'date' },
        revision: { label: 'Revisión', type: 'text' },
        autor: { label: 'Autor', type: 'text' },
        realizo: { label: 'Realizó', type: 'text' },
    },
    default: {
        id: { label: 'ID', type: 'text', required: true, readonlyOnEdit: true },
        descripcion: { label: 'Descripción', type: 'text' },
    }
};

// =================================================================================
// --- 3. SERVICIO DE UI (UNIFICADO Y MEJORADO) ---
// =================================================================================

const uiService = {
    showToast: (message, type = 'info', duration = 3000) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    showConfirmationModal: (title, message, onConfirm) => {
        const modalId = 'confirmation-modal';
        if (document.getElementById(modalId)) return;
        const modalHTML = `<div id="${modalId}" class="fixed inset-0 modal-backdrop flex items-center justify-center z-[1055]"><div class="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-scale-in"><div class="p-5 border-b flex items-center gap-3"><div class="w-10 h-10 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center"><i data-lucide="alert-triangle" class="h-6 w-6 text-red-600"></i></div><div><h2 class="text-lg font-bold text-slate-800">${title}</h2></div></div><div class="p-5"><p class="text-slate-600">${message}</p></div><div class="p-4 border-t bg-slate-50 flex justify-end gap-3"><button data-action="close-modal" class="btn btn-secondary">Cancelar</button><button id="confirm-action-btn" class="btn bg-red-600 text-white hover:bg-red-700">Confirmar</button></div></div></div>`;
        dom.modalContainer.innerHTML = modalHTML;
        lucide.createIcons();
        const modal = document.getElementById(modalId);
        const closeModal = () => modal.remove();
        modal.querySelector('[data-action="close-modal"]').onclick = closeModal;
        document.getElementById('confirm-action-btn').onclick = () => {
            if (typeof onConfirm === 'function') onConfirm();
            closeModal();
        };
    },

    showEditPanel: ({ title, schema, fields, data = {}, onSave }) => {
        const panelId = 'edit-panel';
        if (document.getElementById(panelId)) return;

        const generateFieldHTML = (field) => {
            const fieldId = `form-field-${field.key}`;
            const value = data[field.key] || '';
            const commonClasses = "w-full bg-white mt-1 p-2 border rounded-md shadow-sm text-sm";
            const isReadonly = field.readonlyOnEdit && data.docId;

            if (isReadonly) {
                return `<input type="text" id="${fieldId}" name="${field.key}" value="${value}" class="${commonClasses} bg-slate-100" readonly>`;
            }

            switch (field.type) {
                case 'boolean':
                    return `<input type="checkbox" id="${fieldId}" name="${field.key}" class="h-5 w-5 mt-2" ${value ? 'checked' : ''}>`;
                case 'relation':
                    const relatedCollection = appState.collections[field.collection] || [];
                    return `<select id="${fieldId}" name="${field.key}" class="${commonClasses}"><option value="">Seleccionar...</option>${relatedCollection.map(item => `<option value="${item.docId}" ${item.docId === value ? 'selected' : ''}>${item.descripcion || item.id}</option>`).join('')}</select>`;
                case 'select':
                    const options = field.options || [];
                    return `<select id="${fieldId}" name="${field.key}" class="${commonClasses}"><option value="">Seleccionar...</option>${options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}</select>`;
                case 'textarea':
                    return `<textarea id="${fieldId}" name="${field.key}" class="${commonClasses}" rows="3">${value}</textarea>`;
                default:
                    return `<input type="${field.type || 'text'}" id="${fieldId}" name="${field.key}" value="${value}" class="${commonClasses}">`;
            }
        };

        const formFieldsHTML = fields.map(field => `<div id="field-wrapper-${field.key}" class="${field.fullWidth ? 'col-span-2' : ''}">
            <label for="form-field-${field.key}" class="block text-sm font-medium text-slate-700">${field.label} ${field.required ? '<span class="text-red-500">*</span>' : ''}</label>
            ${generateFieldHTML(field)}
            <p id="error-${field.key}" class="text-red-600 text-xs mt-1 hidden"></p>
        </div>`).join('');

        const panelHTML = `<div id="${panelId}-backdrop" class="fixed inset-0 modal-backdrop z-[1050]"><div id="${panelId}" class="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-in-out"><div class="p-5 border-b flex justify-between items-center"><h2 class="text-xl font-bold text-slate-800">${title}</h2><button data-action="close-panel" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button></div><div class="p-5 grid grid-cols-2 gap-4 flex-grow overflow-y-auto">${formFieldsHTML}</div><div class="p-4 border-t bg-slate-50 flex justify-end gap-3"><button data-action="close-panel" class="btn btn-secondary">Cancelar</button><button id="panel-save-btn" class="btn btn-primary">Guardar Cambios</button></div></div></div>`;
        dom.modalContainer.innerHTML = panelHTML;
        lucide.createIcons();

        const panel = document.getElementById(panelId);
        const backdrop = document.getElementById(`${panelId}-backdrop`);
        const closePanel = () => {
            panel.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0');
            backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true });
        };

        setTimeout(() => panel.classList.remove('translate-x-full'), 50);

        backdrop.querySelectorAll('[data-action="close-panel"]').forEach(btn => btn.onclick = closePanel);

        document.getElementById('panel-save-btn').onclick = async () => {
            const newData = { ...data };
            let hasError = false;

            panel.querySelectorAll('[id^=error-]').forEach(el => { el.classList.add('hidden'); el.textContent = ''; });
            panel.querySelectorAll('[id^=form-field-]').forEach(el => el.classList.remove('border-red-500'));

            fields.forEach(field => {
                const input = document.getElementById(`form-field-${field.key}`);
                newData[field.key] = input.type === 'checkbox' ? input.checked : input.value;
            });

            if (typeof onSave === 'function') {
                const result = await onSave(newData);
                if (!result.success) {
                    hasError = true;
                    for (const key in result.errors) {
                        const errorEl = document.getElementById(`error-${key}`);
                        const fieldEl = document.getElementById(`form-field-${key}`);
                        if (errorEl) {
                            errorEl.textContent = result.errors[key];
                            errorEl.classList.remove('hidden');
                        }
                        if (fieldEl) {
                            fieldEl.classList.add('border-red-500');
                        }
                    }
                } else {
                    closePanel();
                }
            }
        };
    },

    showQuickViewModal: async ({ collectionName, docId }) => {
        const modalId = 'quick-view-modal';
        if (document.getElementById(modalId)) return;

        const modalHTML = `<div id="${modalId}" class="fixed inset-0 modal-backdrop flex items-center justify-center z-[1055]"><div id="${modalId}-content" class="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-in"><div class="p-4 text-center text-slate-500"><div class="loading-spinner mx-auto"></div><p class="mt-2">Cargando...</p></div></div></div>`;
        dom.modalContainer.innerHTML = modalHTML;

        const modal = document.getElementById(modalId);
        const modalContent = document.getElementById(`${modalId}-content`);
        const closeModal = () => modal.remove();
        modal.addEventListener('click', (e) => {
            if (e.target.id === modalId) closeModal();
        });

        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("Documento no encontrado.");
            }

            const item = { docId: docSnap.id, ...docSnap.data() };
            const schema = schemas[collectionName] || schemas.default;
            const allSchemaKeys = Object.keys(schema).filter(k => k !== 'formattingRules');
            const populatedItem = (appState.collectionsById[collectionName]?.get(docId))
                ? dataService.populateData([item], schema)[0]
                : item;

            const title = populatedItem.descripcion || populatedItem.id || 'Detalle';
            const collectionTitle = collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1);

            const contentHTML = `
                <div class="p-5 border-b flex justify-between items-center">
                    <div>
                        <p class="text-xs font-semibold text-blue-600 uppercase">${collectionTitle}</p>
                        <h2 class="text-xl font-bold text-slate-800">${title}</h2>
                    </div>
                    <button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button>
                </div>
                <div class="p-5 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    ${allSchemaKeys.map(key => `
                        <div>
                            <p class="text-xs font-semibold text-slate-500 uppercase">${schema[key]?.label || key}</p>
                            <div class="mt-1 text-sm">${dataService.formatDisplayValue(populatedItem[key], schema[key], item)}</div>
                        </div>
                    `).join('')}
                </div>
                 <div class="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button data-action="close-modal" class="btn btn-secondary">Cerrar</button>
                </div>
            `;
            modalContent.innerHTML = contentHTML;
            lucide.createIcons();
            modalContent.querySelector('[data-action="close-modal"]').onclick = closeModal;

        } catch (error) {
            console.error("Error en Quick View:", error);
            modalContent.innerHTML = `<div class="p-5 text-center"><p class="text-red-500 font-semibold">No se pudo cargar la información.</p><button data-action="close-modal" class="btn btn-secondary mt-4">Cerrar</button></div>`;
            modalContent.querySelector('[data-action="close-modal"]').onclick = closeModal;
        }
    },
    
    openSearchModal: ({ collectionName, title, onSelect, filter, allowedCollections = [] }) => {
        const modalId = 'search-modal';
        if (document.getElementById(modalId)) return;

        const modalHTML = `
            <div id="${modalId}" class="fixed inset-0 modal-backdrop flex items-center justify-center z-[1055]">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-in max-h-[80vh]">
                    <div class="p-5 border-b flex justify-between items-center">
                        <h2 class="text-xl font-bold text-slate-800">${title}</h2>
                        <button data-action="close-modal" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="x" class="h-6 w-6"></i></button>
                    </div>
                    <div class="p-5">
                        <input type="text" id="search-modal-input" placeholder="Buscar por descripción..." class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div id="search-modal-results" class="flex-grow overflow-y-auto px-5 pb-5 custom-scrollbar"></div>
                </div>
            </div>
        `;
        dom.modalContainer.innerHTML = modalHTML;
        lucide.createIcons();

        const modal = document.getElementById(modalId);
        const searchInput = document.getElementById('search-modal-input');
        const resultsContainer = document.getElementById('search-modal-results');
        const closeModal = () => modal.remove();

        modal.querySelector('[data-action="close-modal"]').onclick = closeModal;

        const renderResults = (searchTerm = '') => {
            let allItems = [];
            const collectionsToSearch = allowedCollections.length > 0 ? allowedCollections : [collectionName];

            collectionsToSearch.forEach(coll => {
                const items = (appState.collections[coll] || []).map(item => ({ ...item, collectionName: coll }));
                allItems.push(...items);
            });

            let filteredItems = allItems.filter(item =>
                (item.descripcion || item.name || item.id || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (typeof filter === 'function') {
                filteredItems = filteredItems.filter(filter);
            }

            if (filteredItems.length === 0) {
                resultsContainer.innerHTML = `<p class="text-center text-slate-500 py-4">No se encontraron resultados.</p>`;
                return;
            }

            resultsContainer.innerHTML = filteredItems.map(item => `
                <div data-action="select-item" data-id="${item.docId}" data-collection="${item.collectionName}" class="p-3 rounded-md hover:bg-blue-50 cursor-pointer border-b last:border-b-0">
                    <p class="font-semibold text-slate-800">${item.descripcion || item.name || item.id}</p>
                    <p class="text-xs text-slate-400 font-medium uppercase">${item.collectionName.slice(0,-1)}</p>
                </div>
            `).join('');
        };

        searchInput.addEventListener('input', () => renderResults(searchInput.value));
        resultsContainer.addEventListener('click', (e) => {
            const itemElement = e.target.closest('[data-action="select-item"]');
            if (itemElement) {
                const selectedId = itemElement.dataset.id;
                const selectedCollection = itemElement.dataset.collection;
                const selectedItem = (appState.collections[selectedCollection] || []).find(item => item.docId === selectedId);
                if (selectedItem && typeof onSelect === 'function') {
                    onSelect(selectedItem, selectedCollection);
                }
                closeModal();
            }
        });

        renderResults();
    }
};

// =================================================================================
// --- 4. SERVICIO DE DATOS (CON LÓGICA DE AUDITORÍA) ---
// =================================================================================

const dataService = {
    logActivity: async (action, details = {}) => {
        try {
            await addDoc(collection(db, 'activity_log'), {
                action,
                ...details,
                userEmail: appState.currentUser.email,
                userName: appState.currentUser.name,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error al registrar actividad:", error);
        }
    },

    startAllListeners: () => {
        if (appState.unsubscribeListeners.length > 0) {
            appState.unsubscribeListeners.forEach(unsub => unsub());
            appState.unsubscribeListeners = [];
        }
        
        const collectionNames = Object.values(COLLECTIONS);
        let loadedCollections = 0;
        const totalCollections = collectionNames.length;

        return new Promise(resolve => {
            collectionNames.forEach(collName => {
                const collRef = collection(db, collName);
                const unsubscribe = onSnapshot(collRef, (snapshot) => {
                    const data = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
                    appState.collections[collName] = data;
                    const newMap = new Map();
                    if (collName === 'usuarios') {
                        data.forEach(item => { newMap.set(item.uid, item); });
                    } else {
                        data.forEach(item => { newMap.set(item.docId, item); if (item.id && item.id !== item.docId) { newMap.set(item.id, item); } });
                    }
                    appState.collectionsById[collName] = newMap;
                    
                    if (!appState.initialDataLoaded) {
                        loadedCollections++;
                        if (loadedCollections >= totalCollections) {
                            appState.initialDataLoaded = true;
                            resolve();
                        }
                    } else {
                        switchView(appState.currentView, appState.currentViewPayload, true);
                    }
                }, (error) => {
                    console.error(`Error en el listener de ${collName}:`, error);
                    if (!appState.initialDataLoaded) {
                        loadedCollections++;
                        if (loadedCollections >= totalCollections) {
                            appState.initialDataLoaded = true;
                            resolve();
                        }
                    }
                });
                appState.unsubscribeListeners.push(unsubscribe);
            });
        });
    },
    stopAllListeners: () => {
        appState.unsubscribeListeners.forEach(unsub => unsub());
        appState.unsubscribeListeners = [];
        appState.collections = {};
        appState.collectionsById = {};
        appState.initialDataLoaded = false;
    },
    saveDocument: async (collectionName, data, docId = null) => {
        try {
            const isNew = !docId;
            const idToUse = docId || doc(collection(db, collectionName)).id;
            const docRef = doc(db, collectionName, idToUse);
            data.docId = idToUse;

            if (isNew) {
                data.creadoPor = appState.currentUser.email;
                data.fechaCreacion = serverTimestamp();
            }
            data.modificadoPor = appState.currentUser.email;
            data.fechaModificacion = serverTimestamp();

            await setDoc(docRef, data, { merge: true });

            const action = isNew ? `creó un nuevo registro` : `actualizó un registro`;
            const docName = data.descripcion || data.name || data.id || idToUse;
            dataService.logActivity(`${action} en ${collectionName}`, {
                documentName: docName,
                collection: collectionName,
                docId: idToUse
            });

            return true;
        } catch (error) {
            console.error("Error guardando documento:", error);
            uiService.showToast(`Error al guardar en ${collectionName}`, 'error');
            return false;
        }
    },
    deleteDocument: async (collectionName, docId) => {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            const docData = docSnap.exists() ? docSnap.data() : {};
            const docName = docData.descripcion || docData.name || docData.id || docId;

            await deleteDoc(docRef);

            dataService.logActivity(`eliminó un registro de ${collectionName}`, {
                documentName: docName,
                collection: collectionName,
                docId: docId
            });

            return true;
        }
        catch (error) {
            console.error("Error eliminando documento:", error);
            uiService.showToast(`Error al eliminar de ${collectionName}`, 'error');
            return false;
        }
    },

    getDocById: async (collectionName, docId) => {
        try {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { docId: docSnap.id, ...docSnap.data() };
            } else {
                console.warn(`Document with id ${docId} not found in ${collectionName}`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching document ${docId} from ${collectionName}:`, error);
            uiService.showToast('Error al obtener el documento.', 'error');
            return null;
        }
    },

    getData: async (collectionName, { filters = {}, sortColumn = 'id', sortDirection = 'asc', page = 1, itemsPerPage = 10, startAfterDoc = null }) => {
        const collRef = collection(db, collectionName);
        const schema = schemas[collectionName] || schemas.default;
        let queryConstraints = [];

        for (const [key, value] of Object.entries(filters)) {
            if (value && value !== 'all') {
                if (schema[key]?.type === 'boolean') {
                    queryConstraints.push(where(key, '==', value === 'true'));
                } else if (schema[key]?.type === 'relation' || schema[key]?.type === 'select') {
                    queryConstraints.push(where(key, '==', value));
                } else {
                    queryConstraints.push(where(key, '>=', value));
                    queryConstraints.push(where(key, '<=', value + '\uf8ff'));
                }
            }
        }

        const countQuery = query(collRef, ...queryConstraints);
        const countSnapshot = await getCountFromServer(countQuery);
        const totalCount = countSnapshot.data().count;

        queryConstraints.push(orderBy(sortColumn, sortDirection));

        if (startAfterDoc) {
            queryConstraints.push(startAfter(startAfterDoc));
        }

        queryConstraints.push(limit(itemsPerPage));

        const finalQuery = query(collRef, ...queryConstraints);
        const dataSnapshot = await getDocs(finalQuery);
        const data = dataSnapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const lastVisible = dataSnapshot.docs[dataSnapshot.docs.length - 1];

        return { data, totalCount, lastVisible };
    },

    populateData: (data, schema) => {
        return data.map(item => {
            const populatedItem = { ...item };
            for (const key in schema) {
                if (key === 'formattingRules') continue;
                if (schema[key]?.type === 'relation' && populatedItem[key]) {
                    const { collection, field = 'descripcion' } = schema[key];
                    const relatedDoc = appState.collectionsById[collection]?.get(populatedItem[key]);
                    populatedItem[key] = relatedDoc ? relatedDoc[field] || `ID: ${populatedItem[key]}` : `<span class="text-red-500">Relación Rota</span>`;
                }
            }
            return populatedItem;
        });
    },

    formatDisplayValue: (value, fieldSchema, item) => {
        if (value === undefined || value === null || value === '') return '<span class="text-slate-400">Sin asignar</span>';
        if (fieldSchema?.type === 'boolean') { return value ? '<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Activo</span>' : '<span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Inactivo</span>'; }
        if (fieldSchema?.type === 'relation' && item[fieldSchema.key]) { return `<a href="#" data-action="navigate-to-relation" data-collection="${fieldSchema.collection}" data-doc-id="${item[fieldSchema.key]}" class="text-blue-600 hover:underline font-semibold">${value}</a>`; }
        if (fieldSchema?.type === 'email') { return `<span class="flex items-center gap-2"><i data-lucide="mail" class="h-4 w-4 text-slate-400"></i>${value}</span>`; }
        if (fieldSchema?.type === 'tel') { return `<span class="flex items-center gap-2"><i data-lucide="phone" class="h-4 w-4 text-slate-400"></i>${value}</span>`; }
        return value;
    },

    checkIdExists: async (collectionName, id, excludeDocId = null) => {
        try {
            const q = query(collection(db, collectionName), where('id', '==', id));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return false;
            if (excludeDocId) {
                return snapshot.docs.some(doc => doc.id !== excludeDocId);
            }
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking ID existence:", error);
            return true;
        }
    },

    getSavedViews: async (collectionName) => {
        if (!appState.currentUser) return [];
        try {
            const q = query(collection(db, 'datatable_views'), where('collection', '==', collectionName), where('userId', '==', appState.currentUser.uid));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error obteniendo vistas guardadas:", error);
            return [];
        }
    },
    saveView: async (collectionName, viewConfig) => {
        try {
            const docRef = await addDoc(collection(db, 'datatable_views'), {
                collection: collectionName,
                userId: appState.currentUser.uid,
                ...viewConfig
            });
            return { id: docRef.id, collection: collectionName, ...viewConfig };
        } catch (error) {
            console.error("Error guardando la vista:", error);
            uiService.showToast('No se pudo guardar la vista.', 'error');
            return null;
        }
    },
    deleteView: async (viewId) => {
        try {
            await deleteDoc(doc(db, 'datatable_views', viewId));
            return true;
        } catch (error) {
            console.error("Error eliminando la vista:", error);
            uiService.showToast('No se pudo eliminar la vista.', 'error');
            return false;
        }
    },

    saveDocumentAndCreateVersion: async (collectionName, docId, dataToSave, versionData) => {
        try {
            const mainDocRef = doc(db, collectionName, docId);
            const versionsColRef = collection(db, collectionName, docId, 'versions');

            const fullVersionData = {
                ...versionData,
                savedAt: serverTimestamp(),
                savedBy: appState.currentUser.email
            };

            await addDoc(versionsColRef, fullVersionData);

            const mainData = {
                ...dataToSave,
                lastUpdated: fullVersionData.savedAt,
                updatedBy: fullVersionData.savedBy
            };

            await setDoc(mainDocRef, mainData, { merge: true });

            const docName = dataToSave.descripcion || dataToSave.name || dataToSave.id || docId;
            dataService.logActivity(`creó una nueva versión en ${collectionName}`, {
                documentName: docName,
                collection: collectionName,
                docId: docId
            });

            return true;
        } catch (error) {
            console.error(`Error guardando documento y versión en ${collectionName}:`, error);
            uiService.showToast(`Error al guardar la nueva versión.`, 'error');
            return false;
        }
    },

    getVersionHistory: async (collectionName, docId) => {
        try {
            const versionsColRef = collection(db, collectionName, docId, 'versions');
            const q = query(versionsColRef, orderBy('savedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ versionId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Error obteniendo historial de versiones de ${docId}:`, error);
            uiService.showToast('No se pudo cargar el historial de versiones.', 'error');
            return [];
        }
    },

    getVersion: async (collectionName, docId, versionId) => {
        try {
            const versionDocRef = doc(db, collectionName, docId, 'versions', versionId);
            const docSnap = await getDoc(versionDocRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error(`Error obteniendo la versión ${versionId}:`, error);
            uiService.showToast('No se pudo cargar la versión seleccionada.', 'error');
            return null;
        }
    },
};


// =================================================================================
// --- 5. SERVICIO DE AUTENTICACIÓN (MEJORADO CON ROLES Y PERFIL) ---
// =================================================================================

const authService = {
    handleAuthStateChange: async (user) => {
        if (user) {
            if (user.emailVerified) {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                let userRole = 'lector';
                if (userDocSnap.exists()) {
                    userRole = userDocSnap.data().role || userRole;
                }

                appState.currentUser = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    avatarUrl: user.photoURL || `https://placehold.co/40x40/1e40af/ffffff?text=${(user.displayName || user.email).charAt(0).toUpperCase()}`,
                    role: userRole
                };
                
                authService.updateAuthView(true);
                
                await dataService.startAllListeners();
                dom.loadingOverlay.style.display = 'none';
                
                if (!appState.isAppInitialized) {
                    appState.isAppInitialized = true;
                    switchView(appState.currentView);
                }
                uiService.showToast(`¡Bienvenido, ${appState.currentUser.name}!`, 'success');

            } else {
                dom.loadingOverlay.style.display = 'none';
                uiService.showToast('Por favor, verifica tu correo para continuar.', 'info');
                authService.updateAuthView(false);
                authService.showAuthScreen('verify-email');
            }
        } else {
            dom.loadingOverlay.style.display = 'none';
            authService.updateAuthView(false);
        }
    },
    updateAuthView: (isLoggedIn) => {
        if (isLoggedIn) {
            dom.authContainer.classList.add('hidden');
            dom.appView.classList.remove('hidden');
            authService.renderUserMenu();
        } else {
            dataService.stopAllListeners();
            dom.authContainer.classList.remove('hidden');
            dom.appView.classList.add('hidden');
            appState.currentUser = null;
            authService.showAuthScreen('login');
            appState.isAppInitialized = false;
        }
    },
    handleAuthForms: async (e) => {
        e.preventDefault();
        const form = e.target;
        if (!form.matches('form')) return;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<i data-lucide="loader" class="animate-spin h-5 w-5 mx-auto"></i>`;
        lucide.createIcons();
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]')?.value;
        try {
            if (form.id === 'login-form') {
                await signInWithEmailAndPassword(auth, email, password);
            } else if (form.id === 'register-form') {
                const name = form.querySelector('#register-name').value;
                if (!email.toLowerCase().endsWith('@barackmercosul.com')) {
                    uiService.showToast('Dominio no autorizado.', 'error');
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });

                const userDocRef = doc(db, "usuarios", userCredential.user.uid);
                await setDoc(userDocRef, {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    name: name,
                    role: 'editor',
                    createdAt: serverTimestamp()
                });

                await sendEmailVerification(userCredential.user);
                uiService.showToast('Registro exitoso. Correo de verificación enviado.', 'info');
                authService.showAuthScreen('verify-email');
            } else if (form.id === 'reset-form') {
                await sendPasswordResetEmail(auth, email);
                uiService.showToast(`Enlace enviado a ${email}.`, 'info');
                authService.showAuthScreen('login');
            }
        } catch (error) {
            let msg = 'Error inesperado.';
            switch (error.code) {
                case 'auth/invalid-login-credentials':
                case 'auth/wrong-password':
                case 'auth/user-not-found':
                    msg = 'Credenciales incorrectas.';
                    break;
                case 'auth/email-already-in-use':
                    msg = 'Este correo ya está registrado.';
                    break;
                case 'auth/weak-password':
                    msg = 'La contraseña debe tener al menos 6 caracteres.';
                    break;
            }
            uiService.showToast(msg, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    },
    logOutUser: async () => {
        try {
            await signOut(auth);
        } catch (e) {
            uiService.showToast("Error al cerrar sesión.", "error");
        }
    },
    renderUserMenu: () => {
        if (appState.currentUser) {
            const userRole = appState.currentUser.role.charAt(0).toUpperCase() + appState.currentUser.role.slice(1);
            const isAdmin = appState.currentUser.role === 'administrador';

            dom.userMenuContainer.innerHTML = `
                <div id="user-dropdown" class="relative">
                    <button data-action="toggle-dropdown" data-dropdown-target="user-dropdown-menu" class="flex items-center space-x-2">
                        <img src="${appState.currentUser.avatarUrl}" alt="Avatar" class="w-12 h-12 rounded-full border-2 border-slate-300">
                        <i data-lucide="chevron-down" class="text-slate-600"></i>
                    </button>
                    <div id="user-dropdown-menu" class="dropdown-menu hidden absolute z-20 right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl">
                        <div class="p-4 border-b">
                            <p class="font-bold text-slate-800">${appState.currentUser.name}</p>
                            <p class="text-sm text-slate-500 truncate" title="${appState.currentUser.email}">${appState.currentUser.email}</p>
                            <span class="inline-block mt-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">${userRole}</span>
                        </div>
                        <a href="#" data-view="profile" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100"><i data-lucide="user-circle" class="w-5 h-5 text-slate-500"></i>Mi Perfil</a>
                        ${isAdmin ? `<a href="#" data-view="usuarios" class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-100"><i data-lucide="users" class="w-5 h-5 text-slate-500"></i>Gestión de Usuarios</a>` : ''}
                        <a href="#" id="logout-button" class="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"><i data-lucide="log-out" class="w-5 h-5"></i>Cerrar Sesión</a>
                    </div>
                </div>`;
        } else {
            dom.userMenuContainer.innerHTML = '';
        }
        lucide.createIcons();
    },
    showAuthScreen: (screenName) => {
        dom.authContainer.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
        const panelToShow = dom.authContainer.querySelector(`#${screenName}-panel`);
        if (panelToShow) panelToShow.classList.remove('hidden');
    },
    runProfileLogic: (container) => {
        const user = appState.currentUser;
        const userRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);

        container.innerHTML = `
            <div class="animate-fade-in-up space-y-8 max-w-4xl mx-auto">
                <div>
                    <h2 class="text-3xl font-extrabold text-slate-800">Mi Perfil</h2>
                    <p class="text-slate-500 mt-1">Gestiona tu información personal y la seguridad de tu cuenta.</p>
                </div>

                <!-- Tarjeta de Información Personal -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                    <form id="profile-info-form">
                        <div class="p-6 border-b">
                            <h3 class="text-lg font-bold text-slate-800">Información Personal</h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label for="profile-name" class="block text-sm font-medium text-slate-700">Nombre</label>
                                <input type="text" id="profile-name" name="profile-name" value="${user.name}" class="w-full mt-1 p-2 border rounded-md">
                            </div>
                            <div>
                                <label for="profile-email" class="block text-sm font-medium text-slate-700">Email</label>
                                <input type="email" id="profile-email" name="profile-email" value="${user.email}" class="w-full mt-1 p-2 border rounded-md bg-slate-100" readonly>
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-slate-700">Rol</label>
                                <p class="mt-2 text-sm font-semibold text-blue-800">${userRole}</p>
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 flex justify-end">
                            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                </div>

                <!-- Tarjeta de Seguridad -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200">
                    <form id="profile-password-form">
                        <div class="p-6 border-b">
                            <h3 class="text-lg font-bold text-slate-800">Seguridad de la Cuenta</h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label for="current-password" class="block text-sm font-medium text-slate-700">Contraseña Actual</label>
                                <input type="password" id="current-password" name="current-password" class="w-full mt-1 p-2 border rounded-md" required>
                            </div>
                            <div>
                                <label for="new-password" class="block text-sm font-medium text-slate-700">Nueva Contraseña</label>
                                <input type="password" id="new-password" name="new-password" class="w-full mt-1 p-2 border rounded-md" required>
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 flex justify-end">
                            <button type="submit" class="btn btn-primary">Cambiar Contraseña</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const infoForm = document.getElementById('profile-info-form');
        infoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = infoForm.querySelector('#profile-name').value.trim();
            if (newName === user.name) {
                uiService.showToast('No se han realizado cambios en el nombre.', 'info');
                return;
            }

            try {
                await updateProfile(auth.currentUser, { displayName: newName });
                const userDocRef = doc(db, "usuarios", user.uid);
                await updateDoc(userDocRef, { name: newName });

                dataService.logActivity('actualizó su nombre de perfil', { from: user.name, to: newName });

                appState.currentUser.name = newName;
                authService.renderUserMenu();
                uiService.showToast('Nombre actualizado con éxito.', 'success');
            } catch (error) {
                console.error("Error al actualizar el nombre:", error);
                uiService.showToast('No se pudo actualizar el nombre.', 'error');
            }
        });

        const passwordForm = document.getElementById('profile-password-form');
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = passwordForm.querySelector('#current-password').value;
            const newPassword = passwordForm.querySelector('#new-password').value;
            
            if (newPassword.length < 6) {
                 uiService.showToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
                 return;
            }

            try {
                const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updatePassword(auth.currentUser, newPassword);
                
                dataService.logActivity('actualizó su contraseña');
                
                passwordForm.reset();
                uiService.showToast('Contraseña actualizada con éxito.', 'success');
            } catch (error) {
                console.error("Error al cambiar contraseña:", error);
                let msg = 'No se pudo cambiar la contraseña.';
                if (error.code === 'auth/wrong-password') {
                    msg = 'La contraseña actual es incorrecta.';
                }
                uiService.showToast(msg, 'error');
            }
        });

        return () => {
            // Limpieza de eventos si es necesario
        };
    },
    checkEmailVerification: async (linkElement) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const originalText = linkElement.innerHTML;
        linkElement.innerHTML = `<i data-lucide="loader" class="inline-block animate-spin h-4 w-4 mr-1"></i> Verificando...`;
        lucide.createIcons();
        try {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                uiService.showToast('¡Correo verificado con éxito!', 'success');
                authService.handleAuthStateChange(currentUser);
            } else {
                uiService.showToast('Aún no se ha verificado el correo. Por favor, revisa tu bandeja de entrada.', 'error');
                linkElement.innerHTML = originalText;
            }
        } catch (error) {
            uiService.showToast('Error al verificar el correo.', 'error');
            linkElement.innerHTML = originalText;
        }
    }
};

// =================================================================================
// --- 6. LÓGICA DE NAVEGACIÓN Y ORQUESTACIÓN ---
// =================================================================================

function switchView(viewName, payload = {}, forceRerender = false) {
    if (!forceRerender && appState.currentView === viewName && appState.isAppInitialized && !Object.keys(payload).length) return;

    if (typeof appState.currentViewCleanup === 'function') {
        appState.currentViewCleanup();
    }

    appState.currentView = viewName;
    appState.currentViewPayload = payload;
    dom.viewBodyContainer.innerHTML = '';
    document.querySelectorAll('#main-nav .topbar-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewName);
    });

    const viewModules = {
        dashboard: dashboardModule,
        'sinoptico-producto': sinopticoModule,
        flujograma: flowchartModule,
        profile: { runLogic: authService.runProfileLogic },
        clientes: databaseViewsModule,
        proveedores: databaseViewsModule,
        procesos: databaseViewsModule,
        proyectos: databaseViewsModule,
        productos: databaseViewsModule,
        insumos: databaseViewsModule,
        subproductos: databaseViewsModule,
        usuarios: usuariosModule,
        actividad: actividadModule,
    };

    const module = viewModules[viewName];
    if (module && typeof module.runLogic === 'function') {
        const dependencies = { appState, db, uiService, dataService, switchView, schemas, COLLECTIONS, firestore: firestoreFunctions };
        if (typeof module.init === 'function' && !module.isInitialized) {
            module.init(dependencies);
            module.isInitialized = true;
        }
        appState.currentViewCleanup = module.runLogic(dom.viewBodyContainer, payload);
    } else {
        dom.viewBodyContainer.innerHTML = `<h1 class="text-2xl font-bold">Vista no encontrada: ${viewName}</h1>`;
        appState.currentViewCleanup = null;
    }
}

// =================================================================================
// --- 7. PUNTO DE ENTRADA Y EVENT LISTENERS GLOBALES ---
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, authService.handleAuthStateChange);
    dom.authContainer.addEventListener('submit', authService.handleAuthForms);

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const dropdownButton = target.closest('[data-action="toggle-dropdown"]');
        const navLink = target.closest('a[data-view]');
        const authLink = target.closest('a[data-auth-screen]');

        if (!target.closest('#db-dropdown')) { document.getElementById('db-dropdown-menu')?.classList.add('hidden'); }
        if (!target.closest('#user-dropdown')) { document.getElementById('user-dropdown-menu')?.classList.add('hidden'); }

        if (dropdownButton) { e.preventDefault(); const targetMenuId = dropdownButton.dataset.dropdownTarget; const menu = document.getElementById(targetMenuId); menu?.classList.toggle('hidden'); return; }
        if (navLink) { e.preventDefault(); switchView(navLink.dataset.view); const parentMenu = navLink.closest('.dropdown-menu'); if (parentMenu) parentMenu.classList.add('hidden'); return; }
        if (authLink) { e.preventDefault(); const screen = authLink.dataset.authScreen; if (screen === 'reload-verify') { authService.checkEmailVerification(authLink); } else { authService.showAuthScreen(screen); } return; }
        if (target.closest('#logout-button')) { e.preventDefault(); authService.logOutUser(); return; }
    });

    lucide.createIcons();
});
