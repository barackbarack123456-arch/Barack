import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '../firebase';

const SUBPRODUCTOS_COLLECTION = 'subproductos';

export const getSubproductos = async () => {
  const subproductosCollection = collection(db, SUBPRODUCTOS_COLLECTION);
  const snapshot = await getDocs(subproductosCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addSubproducto = async (subproductoData) => {
  const subproductosCollection = collection(db, SUBPRODUCTOS_COLLECTION);
  const docRef = await addDoc(subproductosCollection, subproductoData);
  return docRef.id;
};

export const updateSubproducto = async (id, subproductoData) => {
  const subproductoDoc = doc(db, SUBPRODUCTOS_COLLECTION, id);
  await updateDoc(subproductoDoc, subproductoData);
};

export const deleteSubproducto = async (id) => {
  const subproductoDoc = doc(db, SUBPRODUCTOS_COLLECTION, id);
  await deleteDoc(subproductoDoc);
};

export const getSubproductosCount = async () => {
  const subproductosCollection = collection(db, SUBPRODUCTOS_COLLECTION);
  const snapshot = await getDocs(subproductosCollection);
  return snapshot.size;
};
