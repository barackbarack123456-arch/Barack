import { createCrudService } from '../firebaseServiceFactory';
import { db, collection, getDocs } from '../firebase';

const PROYECTOS_COLLECTION = 'proyectos';

const proyectoCrudService = createCrudService(PROYECTOS_COLLECTION);

export const getProyectos = proyectoCrudService.get;
export const addProyecto = proyectoCrudService.add;
export const updateProyecto = proyectoCrudService.update;
export const deleteProyecto = proyectoCrudService.delete;
