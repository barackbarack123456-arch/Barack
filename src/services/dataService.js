import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const PROVEEDORES_COLLECTION = 'proveedores';

// Function to get all suppliers
export const getProveedores = async () => {
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const snapshot = await getDocs(proveedoresCollection);
  const proveedoresList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return proveedoresList;
};

// Function to add a new supplier
export const addProveedor = async (proveedorData) => {
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const docRef = await addDoc(proveedoresCollection, proveedorData);
  return docRef.id;
};

// Function to update a supplier
export const updateProveedor = async (id, proveedorData) => {
  const proveedorDoc = doc(db, PROVEEDORES_COLLECTION, id);
  await updateDoc(proveedorDoc, proveedorData);
};

// Function to delete a supplier
export const deleteProveedor = async (id) => {
  const proveedorDoc = doc(db, PROVEEDORES_COLLECTION, id);
  await deleteDoc(proveedorDoc);
};

// Suggestion for improvement: This file is getting large.
// Consider splitting each module's service functions into its own file
// (e.g., `proveedoresService.js`, `clientesService.js`).

const CLIENTES_COLLECTION = 'clientes';

export const getClientes = async () => {
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const snapshot = await getDocs(clientesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCliente = async (clienteData) => {
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const docRef = await addDoc(clientesCollection, clienteData);
  return docRef.id;
};

export const updateCliente = async (id, clienteData) => {
  const clienteDoc = doc(db, CLIENTES_COLLECTION, id);
  await updateDoc(clienteDoc, clienteData);
};

export const deleteCliente = async (id) => {
  const clienteDoc = doc(db, CLIENTES_COLLECTION, id);
  await deleteDoc(clienteDoc);
};


const INSUMOS_COLLECTION = 'insumos';

export const getInsumos = async () => {
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const snapshot = await getDocs(insumosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addInsumo = async (insumoData) => {
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const docRef = await addDoc(insumosCollection, insumoData);
  return docRef.id;
};

export const updateInsumo = async (id, insumoData) => {
  const insumoDoc = doc(db, INSUMOS_COLLECTION, id);
  await updateDoc(insumoDoc, insumoData);
};

export const deleteInsumo = async (id) => {
  const insumoDoc = doc(db, INSUMOS_COLLECTION, id);
  await deleteDoc(insumoDoc);
};


const PRODUCTOS_COLLECTION = 'productos';

export const getProductos = async () => {
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const snapshot = await getDocs(productosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProducto = async (productoData) => {
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const docRef = await addDoc(productosCollection, productoData);
  return docRef.id;
};

export const updateProducto = async (id, productoData) => {
  const productoDoc = doc(db, PRODUCTOS_COLLECTION, id);
  await updateDoc(productoDoc, productoData);
};

export const deleteProducto = async (id) => {
  const productoDoc = doc(db, PRODUCTOS_COLLECTION, id);
  await deleteDoc(productoDoc);
};
