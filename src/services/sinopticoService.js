import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const SINOPTICO_COLLECTION = 'sinoptico';

/**
 * Fetches all items from the sinoptico collection.
 * Each item represents a node in the hierarchy (product, sub-product, or input).
 */
export const getSinopticoItems = async () => {
  const sinopticoCollection = collection(db, SINOPTICO_COLLECTION);
  const snapshot = await getDocs(sinopticoCollection);
  const itemsList = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return itemsList;
};

/**
 * Adds a new item to the sinoptico collection.
 * @param {object} itemData - The data for the new item.
 * Expected fields: nombre, id_padre, comentarios, cantidad, unidad_medida, orden.
 */
export const addSinopticoItem = async (itemData) => {
  const sinopticoCollection = collection(db, SINOPTICO_COLLECTION);
  // Ensure default values for optional fields if they are not provided
  const dataWithDefaults = {
    comentarios: '',
    cantidad: 0,
    unidad_medida: '',
    orden: 0,
    ...itemData,
  };
  const docRef = await addDoc(sinopticoCollection, dataWithDefaults);
  return docRef.id;
};

/**
 * Updates an existing item in the sinoptico collection.
 * @param {string} id - The document ID of the item to update.
 * @param {object} itemData - An object containing the fields to update.
 */
export const updateSinopticoItem = async (id, itemData) => {
  const itemDoc = doc(db, SINOPTICO_COLLECTION, id);
  await updateDoc(itemDoc, itemData);
};

/**
 * Deletes an item from the sinoptico collection.
 * @param {string} id - The document ID of the item to delete.
 */
export const deleteSinopticoItem = async (id) => {
  const itemDoc = doc(db, SINOPTICO_COLLECTION, id);
  await deleteDoc(itemDoc);
};
