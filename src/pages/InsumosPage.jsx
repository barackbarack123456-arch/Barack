import React, { useState, useEffect } from 'react';
import { getInsumos, addInsumo, updateInsumo, deleteInsumo } from '../services/dataService';
import InsumoModal from '../components/InsumoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function InsumosPage() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingInsumoId, setDeletingInsumoId] = useState(null);

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const data = await getInsumos();
      setInsumos(data);
    } catch (error) {
      console.error("Error fetching supplies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  const handleOpenModal = (insumo = null) => {
    setEditingInsumo(insumo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingInsumo(null);
  };

  const handleSaveInsumo = async (insumoData) => {
    try {
      if (editingInsumo) {
        await updateInsumo(editingInsumo.id, insumoData);
      } else {
        await addInsumo(insumoData);
      }
      handleCloseModal();
      fetchInsumos();
    } catch (error) {
      console.error("Error saving supply:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingInsumoId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteInsumo(deletingInsumoId);
      setConfirmOpen(false);
      setDeletingInsumoId(null);
      fetchInsumos();
    } catch (error) {
      console.error("Error deleting supply:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Insumos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Insumo
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            ) : insumos.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay insumos para mostrar.</td>
              </tr>
            ) : (
              insumos.map((insumo) => (
                <tr key={insumo.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{insumo.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{insumo.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(insumo)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(insumo.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <InsumoModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveInsumo}
        insumo={editingInsumo}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este insumo? Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default InsumosPage;
