import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const CLIENTES_COLLECTION = 'clientes';

export const getClientes = async (userId) => {
  if (!userId) return [];
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const q = query(clientesCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCliente = async (clienteData, userId) => {
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const docRef = await addDoc(clientesCollection, { ...clienteData, userId });
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

export const getClientesCount = async (userId) => {
  if (!userId) return 0;
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const q = query(clientesCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};
