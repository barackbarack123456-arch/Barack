import { createCrudService } from '../firebaseServiceFactory';
import { db, collection, getDocs } from '../firebase';

const SUBPRODUCTOS_COLLECTION = 'subproductos';

const subproductoCrudService = createCrudService(SUBPRODUCTOS_COLLECTION);

export const getSubproductos = subproductoCrudService.get;
export const addSubproducto = subproductoCrudService.add;
export const updateSubproducto = subproductoCrudService.update;
export const deleteSubproducto = subproductoCrudService.delete;

export const getSubproductosCount = async () => {
  const subproductosCollection = collection(db, SUBPRODUCTOS_COLLECTION);
  const snapshot = await getDocs(subproductosCollection);
  return snapshot.size;
};
