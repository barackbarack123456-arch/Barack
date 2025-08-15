import { db } from '../firebase';
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
