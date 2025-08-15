import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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

export const getClientesCount = async () => {
  const clientesCollection = collection(db, CLIENTES_COLLECTION);
  const snapshot = await getDocs(clientesCollection);
  return snapshot.size;
};
