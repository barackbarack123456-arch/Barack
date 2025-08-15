import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '../firebase';

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

export const getProductosCount = async () => {
  const productosCollection = collection(db, PRODUCTOS_COLLECTION);
  const snapshot = await getDocs(productosCollection);
  return snapshot.size;
};
