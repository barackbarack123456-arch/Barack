import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CARATULA_COLLECTION = 'caratula';
const CARATULA_DOC_ID = 'main'; // Assuming a single document for the caratula

export const getCaratulaData = async () => {
  const docRef = doc(db, CARATULA_COLLECTION, CARATULA_DOC_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // Return default/empty data if it doesn't exist
    return {
      elaboradoPor: '',
      revisadoPor: '',
      proyectoId: '',
      fechaEmision: '',
      revision: '',
      nombreParte: '',
      fechaRevision: '',
      numeroParte: '',
      version: '',
      autor: '',
    };
  }
};

export const saveCaratulaData = async (data) => {
  const docRef = doc(db, CARATULA_COLLECTION, CARATULA_DOC_ID);
  await setDoc(docRef, data, { merge: true });
};
