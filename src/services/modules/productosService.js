import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const PRODUCTOS_COLLECTION = 'productos';

export const getProductos = async (userId) => {
  if (!userId) return [];
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const q = query(productosCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProducto = async (productoData, userId) => {
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const docRef = await addDoc(productosCollection, { ...productoData, userId });
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

export const getProductosCount = async (userId) => {
  if (!userId) return 0;
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const q = query(productosCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
