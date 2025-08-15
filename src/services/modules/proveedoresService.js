import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const PROVEEDORES_COLLECTION = 'proveedores';

// Function to get all suppliers
export const getProveedores = async (userId) => {
  if (!userId) return [];
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const q = query(proveedoresCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const proveedoresList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return proveedoresList;
};

// Function to add a new supplier
export const addProveedor = async (proveedorData, userId) => {
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const docRef = await addDoc(proveedoresCollection, { ...proveedorData, userId });
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

export const getProveedoresCount = async (userId) => {
  if (!userId) return 0;
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const q = query(proveedoresCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
