import React, { useState, useEffect, useCallback } from 'react';
import { getProyectos } from '../services/modules/proyectosService';
import { getCaratulaData, saveCaratulaData } from '../services/caratulaService';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/solid';

function Caratula() {
  const [caratulaData, setCaratulaData] = useState({ elaboradoPor: '', revisadoPor: '', proyectoId: '' });
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Proyecto</label>
          {isEditing ? (
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
          ) : (
            <p className="text-lg font-semibold text-gray-800 p-2 bg-gray-50 rounded-md">{getProjectName(caratulaData.proyectoId)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Elaborado por</label>
          {isEditing ? (
            <input
              type="text"
              name="elaboradoPor"
              value={caratulaData.elaboradoPor}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          ) : (
            <p className="text-lg font-semibold text-gray-800 p-2 bg-gray-50 rounded-md">{caratulaData.elaboradoPor || 'N/A'}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Revisado por</label>
          {isEditing ? (
            <input
              type="text"
              name="revisadoPor"
              value={caratulaData.revisadoPor}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          ) : (
            <p className="text-lg font-semibold text-gray-800 p-2 bg-gray-50 rounded-md">{caratulaData.revisadoPor || 'N/A'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Caratula;
