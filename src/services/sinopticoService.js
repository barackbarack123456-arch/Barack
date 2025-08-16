import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getProductos } from './modules/productosService';
import { getSubproductos } from './modules/subproductosService';
import { getInsumos } from './modules/insumosService';

const SINOPTICO_COLLECTION = 'sinoptico';

/**
 * Fetches all items from the sinoptico collection.
 * Each item represents a node in the hierarchy (product, sub-product, or input).
 */
export const getSinopticoTreeData = async () => {
  const [productos, subproductos, insumos] = await Promise.all([
    getProductos(),
    getSubproductos(),
    getInsumos(),
  ]);

  const allItems = [
    ...productos.map(p => ({ ...p, type: 'producto', parentId: p.id_padre || null })),
    ...subproductos.map(s => ({ ...s, type: 'subproducto', parentId: s.id_padre || null })),
    ...insumos.map(i => ({ ...i, type: 'insumo', parentId: i.id_padre || null })),
  ];

  const itemsById = allItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const buildDataPath = (itemId) => {
    const path = [];
    let currentItem = itemsById[itemId];
    while (currentItem) {
      path.unshift(currentItem.nombre);
      currentItem = itemsById[currentItem.parentId];
    }
    return path;
  };

  return allItems.map(item => ({
    ...item,
    dataPath: buildDataPath(item.id),
  }));
};

export const getSinopticoItems = async () => {
  return await getSinopticoTreeData();
};
