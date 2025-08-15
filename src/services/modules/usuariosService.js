import {
  db,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from '../firebase';

const USUARIOS_COLLECTION = 'usuarios';

export const getUsuarios = async () => {
  try {
    const usuariosCollection = collection(db, USUARIOS_COLLECTION);
    const snapshot = await getDocs(usuariosCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    throw new Error("No se pudieron obtener los usuarios. Por favor, intente de nuevo más tarde.");
  }
};

export const updateUsuario = async (id, usuarioData) => {
  try {
    const usuarioDoc = doc(db, USUARIOS_COLLECTION, id);
    await updateDoc(usuarioDoc, usuarioData);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    throw new Error("No se pudo actualizar el usuario. Por favor, intente de nuevo más tarde.");
  }
};

export const deleteUsuario = async (id) => {
  try {
    const usuarioDoc = doc(db, USUARIOS_COLLECTION, id);
    await deleteDoc(usuarioDoc);
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw new Error("No se pudo eliminar el usuario. Por favor, intente de nuevo más tarde.");
  }
};
