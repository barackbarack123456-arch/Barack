import { createCrudService } from '../firebaseServiceFactory';
import { db, collection, getDocs } from '../firebase';

const PROVEEDORES_COLLECTION = 'proveedores';

const proveedorCrudService = createCrudService(PROVEEDORES_COLLECTION);

export const getProveedores = proveedorCrudService.get;
export const addProveedor = proveedorCrudService.add;
export const updateProveedor = proveedorCrudService.update;
export const deleteProveedor = proveedorCrudService.delete;

export const getProveedoresCount = async () => {
  const proveedoresCollection = collection(db, PROVEEDORES_COLLECTION);
  const snapshot = await getDocs(proveedoresCollection);
  return snapshot.size;
};
