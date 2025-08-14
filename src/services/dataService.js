import { db, firestoreFunctions } from './firebase';

// Destructure the functions we need from the firestoreFunctions object
const {
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} = firestoreFunctions;

/**
 * Logs an activity to the 'activity_log' collection.
 * This is a private helper function within this service.
 * @param {string} action - The description of the action performed.
 * @param {object} details - Additional details about the action.
 * @param {object} user - The user object (from AuthContext).
 */
const logActivity = async (action, details, user) => {
  if (!user) {
    console.warn("Activity log skipped: current user not provided.");
    return;
  }
  try {
    await addDoc(collection(db, 'activity_log'), {
      action,
      ...details,
      userEmail: user.email,
      userName: user.displayName || user.email,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // In a real app, you might want to send this to a logging service
  }
};

/**
 * Saves a document in a given collection. Can be used for creating or updating.
 * @param {string} collectionName - The name of the collection.
 * @param {object} data - The data to save.
 * @param {object} currentUser - The current user, for logging purposes.
 * @param {string|null} docId - The ID of the document. If null, a new document is created.
 * @returns {Promise<string>} The ID of the saved document.
 */
export const saveDocument = async (collectionName, data, currentUser, docId = null) => {
  const isNew = !docId;
  const idToUse = docId || doc(collection(db, collectionName)).id;
  const docRef = doc(db, collectionName, idToUse);

  const dataToSave = { ...data };
  dataToSave.docId = idToUse; // Ensure the docId is part of the data

  if (isNew) {
    dataToSave.creadoPor = currentUser.email;
    dataToSave.fechaCreacion = serverTimestamp();
  }
  dataToSave.modificadoPor = currentUser.email;
  dataToSave.fechaModificacion = serverTimestamp();

  await setDoc(docRef, dataToSave, { merge: true });

  const action = isNew ? 'creó un nuevo registro' : 'actualizó un registro';
  const docName = data.descripcion || data.name || data.id || idToUse;
  logActivity(`${action} en ${collectionName}`, {
    documentName: docName,
    collection: collectionName,
    docId: idToUse
  }, currentUser);

  return idToUse;
};

/**
 * Deletes a document from a given collection.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The ID of the document to delete.
 * @param {object} currentUser - The current user, for logging purposes.
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId, currentUser) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  const docData = docSnap.exists() ? docSnap.data() : {};
  const docName = docData.descripcion || docData.name || docData.id || docId;

  await deleteDoc(docRef);

  logActivity(`eliminó un registro de ${collectionName}`, {
    documentName: docName,
    collection: collectionName,
    docId: docId
  }, currentUser);
};

/**
 * Fetches a single document by its ID.
 * @param {string} collectionName - The name of the collection.
 * @param {string} docId - The ID of the document.
 * @returns {Promise<object|null>} The document data or null if not found.
 */
export const getDocument = async (collectionName, docId) => {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { docId: docSnap.id, ...docSnap.data() };
    } else {
        console.warn(`Document with id ${docId} not found in ${collectionName}`);
        return null;
    }
};
