import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const PROYECTOS_COLLECTION = 'proyectos';

export const getProyectos = async (userId) => {
  if (!userId) return [];
  const proyectosCollection = collection(db, PROYECTOS_COLLECTION);
  const q = query(proyectosCollection, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addProyecto = async (proyectoData, userId) => {
  const proyectosCollection = collection(db, PROYECTOS_COLLECTION);
  const docRef = await addDoc(proyectosCollection, { ...proyectoData, userId });
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
