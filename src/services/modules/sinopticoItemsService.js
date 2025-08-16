import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '../firebase';

// All synoptic items will be stored in the 'productos' collection for now.
const SINOPTICO_ITEMS_COLLECTION = 'productos';

export const getSinopticoItems = async () => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const snapshot = await getDocs(itemsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addSinopticoItem = async (itemData) => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  // The itemData should be pre-populated with type, parentId, etc.
  const docRef = await addDoc(itemsCollection, itemData);
  return docRef.id;
};

export const updateSinopticoItem = async (id, itemData) => {
  const itemDoc = doc(db, SINOPTICO_ITEMS_COLLECTION, id);
  await updateDoc(itemDoc, itemData);
};

export const deleteSinopticoItem = async (id) => {
  const itemDoc = doc(db, SINOPTICO_ITEMS_COLLECTION, id);
  await deleteDoc(itemDoc);
};

export const getSinopticoItemsCount = async () => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const snapshot = await getDocs(itemsCollection);
  return snapshot.size;
};
