import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
