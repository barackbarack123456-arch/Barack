import { getSinopticoItems, updateSinopticoItem, addSinopticoItem } from './modules/sinopticoItemsService';

/**
 * Fetches only the top-level products for the initial selection screen.
 * Top-level items are those with no parent.
 */
export const getTopLevelProducts = async () => {
  const allItems = await getSinopticoItems();
  // In the new model, top-level items are those with a null/undefined parentId.
  return allItems.filter(item => !item.parentId);
};

/**
 * Fetches all descendants of a given product and builds a hierarchical tree.
 * @param {string} rootProductId The ID of the root product to fetch the hierarchy for.
 */
export const getHierarchyForProduct = async (rootProductId) => {
  const allItems = await getSinopticoItems();

  // Filter for the root product and all its descendants.
  // This assumes every item in a hierarchy will have a 'rootProductId' field.
  const familyItems = allItems.filter(item => item.rootProductId === rootProductId);

  if (familyItems.length === 0) {
    return null; // No hierarchy found
  }

  const itemsById = new Map(familyItems.map(item => [item.id, { ...item, children: [] }]));
  const tree = [];

  for (const item of itemsById.values()) {
    if (item.parentId && itemsById.has(item.parentId)) {
      itemsById.get(item.parentId).children.push(item);
    } else {
      // This is a root item of the tree (or an orphan if parentId is invalid)
      tree.push(item);
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
  const newItem = {
    ...productData,
    parentId: null,
    type: 'producto',
    createdAt: new Date().toISOString(),
    createdBy: userId,
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
    const newItem = {
        ...itemData,
        parentId,
        rootProductId,
        type,
        createdAt: new Date().toISOString(),
        createdBy: userId,
    };
    return await addSinopticoItem(newItem);
};
