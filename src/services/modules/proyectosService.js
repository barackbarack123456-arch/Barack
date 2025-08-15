import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '../firebase';

const PROYECTOS_COLLECTION = 'proyectos';

export const getProyectos = async () => {
  const proyectosCollection = collection(db, PROYECTOS_COLLECTION);
  const snapshot = await getDocs(proyectosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProyecto = async (proyectoData) => {
  const proyectosCollection = collection(db, PROYECTOS_COLLECTION);
  const docRef = await addDoc(proyectosCollection, proyectoData);
  return docRef.id;
};

export const updateProyecto = async (id, proyectoData) => {
  const proyectoDoc = doc(db, PROYECTOS_COLLECTION, id);
  await updateDoc(proyectoDoc, proyectoData);
};

export const deleteProyecto = async (id) => {
  const proyectoDoc = doc(db, PROYECTOS_COLLECTION, id);
  await deleteDoc(proyectoDoc);
};
