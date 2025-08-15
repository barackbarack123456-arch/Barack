import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const INSUMOS_COLLECTION = 'insumos';

export const getInsumos = async (userId) => {
  if (!userId) return [];
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const q = query(insumosCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addInsumo = async (insumoData, userId) => {
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const docRef = await addDoc(insumosCollection, { ...insumoData, userId });
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

export const getInsumosCount = async (userId) => {
  if (!userId) return 0;
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const q = query(insumosCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
