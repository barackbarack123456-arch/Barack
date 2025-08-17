import { createCrudService } from '../firebaseServiceFactory';
import { db, collection, getDocs } from '../firebase';

const CLIENTES_COLLECTION = 'clientes';

const clienteCrudService = createCrudService(CLIENTES_COLLECTION);

export const getClientes = clienteCrudService.get;
export const addCliente = clienteCrudService.add;
export const updateCliente = clienteCrudService.update;
export const deleteCliente = clienteCrudService.delete;

export const getClientesCount = async () => {
  try {
    const clientesCollection = collection(db, CLIENTES_COLLECTION);
    const snapshot = await getDocs(clientesCollection);
    return snapshot.size;
  } catch (error) {
    console.error("Error al obtener el conteo de clientes:", error);
    throw new Error("No se pudo obtener el conteo de clientes. Por favor, intente de nuevo más tarde.");
  }
};
