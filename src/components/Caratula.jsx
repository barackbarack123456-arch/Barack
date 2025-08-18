import React, { useState, useEffect, useCallback } from 'react';
import { getProyectos } from '../services/modules/proyectosService';
import { getCaratulaData, saveCaratulaData } from '../services/caratulaService';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/solid';

function Caratula() {
  const [caratulaData, setCaratulaData] = useState({
    elaboradoPor: '',
    revisadoPor: '',
    proyectoId: '',
    fechaEmision: '',
    revision: '',
    nombreParte: '',
    fechaRevision: '',
    numeroParte: '',
    version: '',
    autor: '',
  });
  const [projects, setProjects] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, projs] = await Promise.all([
        getCaratulaData(),
        getProyectos()
      ]);
      setCaratulaData(data);
      setProjects(projs);
    } catch (err) {
      console.error("Error fetching initial data for Caratula:", err);
      setError("No se pudieron cargar los datos de la carátula.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSave = async () => {
    try {
      await saveCaratulaData(caratulaData);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving caratula data:", err);
      setError("No se pudo guardar la información.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCaratulaData(prev => ({ ...prev, [name]: value }));
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.nombre : 'N/A';
  };

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-lg text-center">Cargando carátula...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Carátula del Sinóptico</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Editar
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Guardar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Row 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">PROYECTO</label>
            <select
                name="proyectoId"
                value={caratulaData.proyectoId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Seleccione un proyecto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de emisión</label>
            <input type="text" name="fechaEmision" value={caratulaData.fechaEmision} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Revisión</label>
            <input type="text" name="revision" value={caratulaData.revision} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div></div> {/* Empty cell for spacing */}

          {/* Row 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">NOMBRE DE PARTE</label>
            <input type="text" name="nombreParte" value={caratulaData.nombreParte} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Realizó</label>
            <input type="text" name="elaboradoPor" value={caratulaData.elaboradoPor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Fecha revisión</label>
            <input type="text" name="fechaRevision" value={caratulaData.fechaRevision} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div></div> {/* Empty cell for spacing */}

          {/* Row 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">NÚMERO DE PARTE</label>
            <input type="text" name="numeroParte" value={caratulaData.numeroParte} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Versión</label>
            <input type="text" name="version" value={caratulaData.version} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Autor</label>
            <input type="text" name="autor" value={caratulaData.autor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Revisado por</label>
            <input type="text" name="revisadoPor" value={caratulaData.revisadoPor} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          {/* Columna 1: Datos del Proyecto */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Datos del Proyecto</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">PROYECTO</dt>
                <dd className="mt-1 text-md text-gray-900">{getProjectName(caratulaData.proyectoId)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de emisión</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.fechaEmision || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Revisión</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.revision || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Columna 2: Datos de la Parte */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Datos de la Parte</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">NOMBRE DE PARTE</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.nombreParte || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">NÚMERO DE PARTE</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.numeroParte || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Versión</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.version || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Columna 3: Datos de Revisión */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Datos de Revisión</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Realizó</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.elaboradoPor || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha revisión</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.fechaRevision || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Autor</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.autor || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Revisado por</dt>
                <dd className="mt-1 text-md text-gray-900">{caratulaData.revisadoPor || 'N/A'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

export default Caratula;
