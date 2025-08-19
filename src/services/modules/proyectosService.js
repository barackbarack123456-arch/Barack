import { createCrudService } from '../firebaseServiceFactory';
import { db, doc, getDoc } from '../firebase';

const PROYECTOS_COLLECTION = 'proyectos';

const proyectoCrudService = createCrudService(PROYECTOS_COLLECTION);

export const getProyectos = proyectoCrudService.get;
export const addProyecto = proyectoCrudService.add;
export const updateProyecto = proyectoCrudService.update;
export const deleteProyecto = proyectoCrudService.delete;

export const getProyectoById = async (id) => {
  if (!id) {
    console.error("ID de proyecto no proporcionado.");
    return null;
  }
  try {
    const docRef = doc(db, PROYECTOS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log("No se encontró el documento del proyecto!");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el documento del proyecto:", error);
    throw error;
  }
};
