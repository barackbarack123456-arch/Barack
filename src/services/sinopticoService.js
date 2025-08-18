import { updateSinopticoItem, addSinopticoItem } from './modules/sinopticoItemsService';
import { db, collection, query, where, getDocs, doc, getDoc, writeBatch, orderBy } from '../services/firebase';

const SINOPTICO_ITEMS_COLLECTION = 'productos';

/**
 * Fetches only the top-level products for the initial selection screen.
 * Top-level items are those with no parent.
 */
export const getTopLevelProducts = async () => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  // Top-level items are those with a null/undefined parentId.
  const q = query(itemsCollection, where('parentId', '==', null));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches all descendants of a given product and builds a hierarchical tree.
 * @param {string} rootProductId The ID of the root product to fetch the hierarchy for.
 */
export const getHierarchyForProduct = async (rootProductId) => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const q = query(itemsCollection, where('rootProductId', '==', rootProductId));
  const snapshot = await getDocs(q);
  const familyItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (familyItems.length === 0) {
    // It's possible only the root product exists and has no `rootProductId` pointing to itself yet.
    // Let's try to fetch it directly.
    const rootDocRef = doc(db, SINOPTICO_ITEMS_COLLECTION, rootProductId);
    const rootDocSnap = await getDoc(rootDocRef);
    if (rootDocSnap.exists()) {
      const rootItem = { id: rootDocSnap.id, ...rootDocSnap.data(), children: [] };
      return [rootItem];
    }
    return null; // No hierarchy found
  }

  const itemsById = new Map(familyItems.map(item => [item.id, { ...item, children: [] }]));

  const tree = [];
  for (const item of itemsById.values()) {
    if (item.parentId && itemsById.has(item.parentId)) {
      itemsById.get(item.parentId).children.push(item);
    } else {
      tree.push(item);
    }
  }

  // Sort children for every node based on the 'orden' field
  for (const item of itemsById.values()) {
    if (item.children.length > 1) {
      item.children.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    }
  }
  tree.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  // Find nodes that are part of a cycle (i.e., not in any valid tree)
  const nodesInTree = new Set();
  const findChildren = (node) => {
    nodesInTree.add(node.id);
    for (const child of node.children) {
        // Guard against infinite loops if a cycle somehow wasn't broken
        if (!nodesInTree.has(child.id)) {
            findChildren(child);
        }
    }
  }
  tree.forEach(findChildren);

  const allIds = Array.from(itemsById.keys());
  const cycleNodeIds = allIds.filter(id => !nodesInTree.has(id));

  if (cycleNodeIds.length > 0) {
      console.warn("Circular dependency detected involving nodes:", cycleNodeIds);
      // Add cycle nodes to the root of the tree to make them visible
      for (const id of cycleNodeIds) {
          const cycleNode = itemsById.get(id);
          // Break the cycle by removing children that are also part of the cycle
          cycleNode.children = cycleNode.children.filter(child => !cycleNodeIds.includes(child.id));
          tree.push(cycleNode);
      }
  }

  return tree;
};

/**
 * Creates a new top-level product.
 * @param {object} productData The data for the product.
 * @param {string} userId The user creating the product.
 */
export const createNewProduct = async (productData, userId) => {
  const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
  const q = query(itemsCollection, where('parentId', '==', null));
  const snapshot = await getDocs(q);
  const orden = snapshot.size;

  const newItem = {
    ...productData,
    parentId: null,
    type: 'producto',
    createdAt: new Date().toISOString(),
    createdBy: userId,
    orden,
    // rootProductId will be set to its own ID after creation
  };
  const newId = await addSinopticoItem(newItem);
  // Set the rootProductId to its own ID
  await updateSinopticoItem(newId, { rootProductId: newId });
  return newId;
};

/**
 * Creates a new child item (subproducto or insumo) within a hierarchy.
 * @param {object} itemData The data for the new item.
 * @param {string} parentId The ID of the parent item.
 * @param {string} rootProductId The ID of the root product of the hierarchy.
 * @param {'subproducto' | 'insumo'} type The type of the new item.
 * @param {string} userId The user creating the item.
 */
export const createNewChildItem = async (itemData, parentId, rootProductId, type, userId) => {
    if (!parentId || !rootProductId) {
        throw new Error('A child item must have a parent and a root product ID.');
    }

    const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);
    const q = query(itemsCollection, where('parentId', '==', parentId));
    const snapshot = await getDocs(q);
    const orden = snapshot.size;

    const newItem = {
        ...itemData,
        parentId,
        rootProductId,
        type,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        orden,
    };
    return await addSinopticoItem(newItem);
};

// Helper function to get all descendant IDs of a given node
const getAllDescendantIds = async (startNodeId, rootProductId) => {
    const itemsCollection = collection(db, 'productos');
    const q = query(itemsCollection, where('rootProductId', '==', rootProductId));
    const snapshot = await getDocs(q);
    const allItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const descendantIds = [];
    const queue = [startNodeId];
    const visited = new Set([startNodeId]);

    while (queue.length > 0) {
        const currentId = queue.shift();
        const children = allItems.filter(item => item.parentId === currentId);
        for (const child of children) {
            if (!visited.has(child.id)) {
                visited.add(child.id);
                descendantIds.push(child.id);
                queue.push(child.id);
            }
        }
    }
    return descendantIds;
};

export const moveSinopticoItem = async (itemId, newParentId, newRootProductId) => {
    const itemRef = doc(db, 'productos', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
        throw new Error("Item to move does not exist.");
    }
    const oldParentId = itemSnap.data().parentId;
    const oldRootProductId = itemSnap.data().rootProductId;

    const batch = writeBatch(db);

    // --- Reparenting Logic ---
    const newSiblingsQuery = query(collection(db, 'productos'), where('parentId', '==', newParentId));
    const newSiblingsSnapshot = await getDocs(newSiblingsQuery);
    const newOrder = newSiblingsSnapshot.size;

    const effectiveRootProductId = newRootProductId || oldRootProductId;
    batch.update(itemRef, { parentId: newParentId, orden: newOrder, rootProductId: effectiveRootProductId });

    // --- Update old siblings order ---
    if (oldParentId !== newParentId) {
        const oldSiblingsQuery = query(collection(db, 'productos'), where('parentId', '==', oldParentId), orderBy('orden'));
        const oldSiblingsSnapshot = await getDocs(oldSiblingsQuery);
        const oldSiblings = oldSiblingsSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.id !== itemId);

        oldSiblings.forEach((sibling, index) => {
            if (sibling.orden !== index) {
                const siblingRef = doc(db, 'productos', sibling.id);
                batch.update(siblingRef, { orden: index });
            }
        });
    }

    // --- Root Change Logic ---
    if (oldRootProductId !== effectiveRootProductId) {
        const descendantIds = await getAllDescendantIds(itemId, oldRootProductId);
        for (const id of descendantIds) {
            const descendantRef = doc(db, 'productos', id);
            batch.update(descendantRef, { rootProductId: effectiveRootProductId });
        }
    }

    await batch.commit();
};

export const updateItemsOrder = async (itemsToUpdate) => {
    const batch = writeBatch(db);
    itemsToUpdate.forEach(item => {
        const itemRef = doc(db, SINOPTICO_ITEMS_COLLECTION, item.id);
        batch.update(itemRef, { orden: item.orden });
    });
    await batch.commit();
};

/**
 * Adds existing items (insumos or subproductos) as new children to a parent item.
 * It creates copies of the selected items and adds them to the hierarchy.
 * @param {string[]} itemIds The IDs of the items to add.
 * @param {string} parentId The ID of the new parent.
 * @param {string} rootProductId The ID of the root product.
 * @param {string} userId The ID of the current user.
 */
export const addExistingItemsAsChildren = async (itemIds, parentId, rootProductId, userId) => {
    if (!itemIds || itemIds.length === 0) return;
    if (!parentId || !rootProductId) throw new Error("Parent and root product ID are required.");

    const batch = writeBatch(db);
    const itemsCollection = collection(db, SINOPTICO_ITEMS_COLLECTION);

    // Get current children count to determine the 'orden' for new items
    const q = query(itemsCollection, where('parentId', '==', parentId));
    const snapshot = await getDocs(q);
    let currentOrder = snapshot.size;

    for (const itemId of itemIds) {
        const itemRef = doc(db, SINOPTICO_ITEMS_COLLECTION, itemId);
        const itemSnap = await getDoc(itemRef);

        if (itemSnap.exists()) {
            const originalData = itemSnap.data();
            // Create a new item object, preserving original data but changing hierarchy details
            const newItemData = {
                ...originalData,
                parentId: parentId,
                rootProductId: rootProductId,
                orden: currentOrder++,
                createdAt: new Date().toISOString(),
                createdBy: userId,
                // Ensure children are not carried over
                children: [],
            };

            // Create a new document reference for the new item
            const newItemRef = doc(itemsCollection);
            batch.set(newItemRef, newItemData);
        } else {
            console.warn(`Item with ID ${itemId} not found. Skipping.`);
        }
    }

    await batch.commit();
};
