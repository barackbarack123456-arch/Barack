import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CLIENTES_COLLECTION = 'clientes';

export const getClientes = async () => {
  try {
    const clientesCollection = collection(db, CLIENTES_COLLECTION);
    const snapshot = await getDocs(clientesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error al obtener clientes:", error);
    // Re-throw the error to be handled by the calling component
    throw new Error("No se pudieron obtener los clientes. Por favor, intente de nuevo más tarde.");
  }
};

export const addCliente = async (clienteData) => {
  try {
    const clientesCollection = collection(db, CLIENTES_COLLECTION);
    const docRef = await addDoc(clientesCollection, clienteData);
    return docRef.id;
  } catch (error) {
    console.error("Error al añadir cliente:", error);
    throw new Error("No se pudo añadir el cliente. Por favor, intente de nuevo más tarde.");
  }
};

export const updateCliente = async (id, clienteData) => {
  try {
    const clienteDoc = doc(db, CLIENTES_COLLECTION, id);
    await updateDoc(clienteDoc, clienteData);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    throw new Error("No se pudo actualizar el cliente. Por favor, intente de nuevo más tarde.");
  }
};

export const deleteCliente = async (id) => {
  try {
    const clienteDoc = doc(db, CLIENTES_COLLECTION, id);
    await deleteDoc(clienteDoc);
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    throw new Error("No se pudo eliminar el cliente. Por favor, intente de nuevo más tarde.");
  }
};

export const getClientesCount = async () => {
  try {
    const clientesCollection = collection(db, CLIENTES_COLLECTION);
    const snapshot = await getDocs(clientesCollection);
    return snapshot.size;
  } catch (error) {
    console.error("Error al obtener el conteo de clientes:", error);
    throw new Error("No se pudo obtener el conteo de clientes. Por favor, intente de nuevo más tarde.");
  }
};
