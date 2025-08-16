import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc
} from '../firebase';
import { auth } from '../firebase';

const SINOPTICO_ITEMS_COLLECTION = 'productos';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

const logAuditEvent = async (action, itemId, details = {}) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found for audit logging.");
    return;
  }

  const auditLogData = {
    action,
    itemId,
    userId: user.uid,
    userEmail: user.email,
    timestamp: serverTimestamp(),
    ...details,
  };

  try {
    const logsCollection = collection(db, AUDIT_LOGS_COLLECTION);
    await addDoc(logsCollection, auditLogData);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};

export const getSinopticoItems = async () => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const snapshot = await getDocs(itemsCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addSinopticoItem = async (itemData) => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const user = auth.currentUser;
  const dataWithMeta = {
    ...itemData,
    createdBy: user?.email,
    createdAt: serverTimestamp(),
    lastModifiedBy: user?.email,
    lastModifiedAt: serverTimestamp(),
  };

  const docRef = await addDoc(itemsCollection, dataWithMeta);
  await logAuditEvent('create', docRef.id, { createdData: dataWithMeta });
  return docRef.id;
};

export const updateSinopticoItem = async (id, itemData) => {
  const itemDocRef = doc(db, SINOPTICO_ITEMS_COLLECTION, id);
  const user = auth.currentUser;

  const docSnap = await getDoc(itemDocRef);
  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }
  const beforeData = docSnap.data();

  const dataWithMeta = {
    ...itemData,
    lastModifiedBy: user?.email,
    lastModifiedAt: serverTimestamp(),
  };

  await updateDoc(itemDocRef, dataWithMeta);

  const changes = Object.keys(dataWithMeta).reduce((acc, key) => {
    if (beforeData[key] !== dataWithMeta[key]) {
      acc[key] = {
        from: beforeData[key] ?? null,
        to: dataWithMeta[key],
      };
    }
    return acc;
  }, {});

  if (Object.keys(changes).length > 0) {
    await logAuditEvent('update', id, { changes });
  }
};

export const deleteSinopticoItem = async (id) => {
  await logAuditEvent('delete', id);
  const itemDoc = doc(db, SINOPTICO_ITEMS_COLLECTION, id);
  await deleteDoc(itemDoc);
};

export const getAuditLogsForItem = async (itemId) => {
  const logsCollection = collection(db, AUDIT_LOGS_COLLECTION);
  const q = query(
    logsCollection,
    where('itemId', '==', itemId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getSinopticoItemsCount = async () => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const snapshot = await getDocs(itemsCollection);
  return snapshot.size;
};
