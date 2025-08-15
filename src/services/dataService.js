import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

/**
 * Creates a CRUD service for a specific Firestore collection.
 * @param {string} collectionName The name of the collection.
 * @returns {object} An object with getAll, add, update, and delete functions.
 */
const createCrudService = (collectionName) => {
  const dataCollection = collection(db, collectionName);

  const getAll = async () => {
    const snapshot = await getDocs(dataCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const add = async (data) => {
    const docRef = await addDoc(dataCollection, data);
    return docRef.id;
  };

  const update = async (id, data) => {
    const dataDoc = doc(db, collectionName, id);
    await updateDoc(dataDoc, data);
  };

  const remove = async (id) => {
    const dataDoc = doc(db, collectionName, id);
    await deleteDoc(dataDoc);
  };

  return {
    getAll,
    add,
    update,
    remove,
  };
};

// --- Services ---

// Proveedores Service
const proveedoresService = createCrudService('proveedores');
export const getProveedores = proveedoresService.getAll;
export const addProveedor = proveedoresService.add;
export const updateProveedor = proveedoresService.update;
export const deleteProveedor = proveedoresService.remove;

// Clientes Service
const clientesService = createCrudService('clientes');
export const getClientes = clientesService.getAll;
export const addCliente = clientesService.add;
export const updateCliente = clientesService.update;
export const deleteCliente = clientesService.remove;

// Productos Service
const productosService = createCrudService('productos');
export const getProductos = productosService.getAll;
export const addProducto = productosService.add;
export const updateProducto = productosService.update;
export const deleteProducto = productosService.remove;

// Insumos Service
const insumosService = createCrudService('insumos');
export const getInsumos = insumosService.getAll;
export const addInsumo = insumosService.add;
export const updateInsumo = insumosService.update;
export const deleteInsumo = insumosService.remove;
