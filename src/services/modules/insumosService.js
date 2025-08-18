import { createCrudService } from '../firebaseServiceFactory';
import { db, collection, getDocs } from '../firebase';

const INSUMOS_COLLECTION = 'insumos';

const insumoCrudService = createCrudService(INSUMOS_COLLECTION);

export const getInsumos = insumoCrudService.get;
export const addInsumo = insumoCrudService.add;
export const updateInsumo = insumoCrudService.update;
export const deleteInsumo = insumoCrudService.delete;

export const getInsumosCount = async () => {
  const insumosCollection = collection(db, INSUMOS_COLLECTION);
  const snapshot = await getDocs(insumosCollection);
  return snapshot.size;
};
