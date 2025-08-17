import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from './firebase';

export const createCrudService = (collectionName) => {
  const dataCollection = collection(db, collectionName);

  const get = async () => {
    try {
      const snapshot = await getDocs(dataCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error al obtener datos de ${collectionName}:`, error);
      throw new Error(`No se pudieron obtener los datos de ${collectionName}.`);
    }
  };

  const add = async (data) => {
    try {
      const docRef = await addDoc(dataCollection, data);
      return docRef.id;
    } catch (error) {
      console.error(`Error al añadir dato en ${collectionName}:`, error);
      throw new Error(`No se pudo añadir el dato en ${collectionName}.`);
    }
  };

  const update = async (id, data) => {
    try {
      const dataDoc = doc(db, collectionName, id);
      await updateDoc(dataDoc, data);
    } catch (error) {
      console.error(`Error al actualizar dato en ${collectionName}:`, error);
      throw new Error(`No se pudo actualizar el dato en ${collectionName}.`);
    }
  };

  const remove = async (id) => {
    try {
      const dataDoc = doc(db, collectionName, id);
      await deleteDoc(dataDoc);
    } catch (error) {
      console.error(`Error al eliminar dato de ${collectionName}:`, error);
      throw new Error(`No se pudo eliminar el dato de ${collectionName}.`);
    }
  };

  return {
    get,
    add,
    update,
    delete: remove,
  };
};
