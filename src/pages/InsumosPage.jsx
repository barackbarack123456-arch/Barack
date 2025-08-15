import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getInsumos, addInsumo, updateInsumo, deleteInsumo } from '../services/modules/insumosService';
import { useAuth } from '../hooks/useAuth';
import InsumoModal from '../components/InsumoModal';
import InfoModal from '../components/InfoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import { PlusIcon, PencilIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const ActionsCellRenderer = ({ data, onInfo, onEdit, onDelete }) => (
  <div className="flex items-center justify-end space-x-2">
    <button data-testid="info-button" onClick={() => onInfo(data)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
      <InformationCircleIcon className="h-5 w-5" />
    </button>
    <button data-testid="edit-button" onClick={() => onEdit(data)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
      <PencilIcon className="h-5 w-5" />
    </button>
    <button data-testid="delete-button" onClick={() => onDelete(data.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

function InsumosPage() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingInsumoId, setDeletingInsumoId] = useState(null);
  const { currentUser } = useAuth();

  const fetchInsumos = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getInsumos(currentUser.uid);
      setInsumos(data);
    } catch (error) {
      console.error("Error fetching supplies:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInsumos();
  }, [fetchInsumos]);

  const handleOpenModal = (insumo = null) => {
    setEditingInsumo(insumo);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingInsumo(null);
  };

  const handleSaveInsumo = async (insumoData) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }
    try {
      if (editingInsumo) {
        await updateInsumo(editingInsumo.id, insumoData);
      } else {
        await addInsumo(insumoData, currentUser.uid);
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

  const handleInfo = (insumo) => {
    setSelectedInsumo(insumo);
    setInfoModalOpen(true);
  };

  const columnDefs = useMemo(() => [
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Descripción", field: "descripcion", flex: 2, sortable: true, filter: true },
    { headerName: "Unidad", field: "unidad", flex: 1, sortable: true, filter: true },
    { headerName: "Material", field: "material", flex: 1, sortable: true, filter: true },
    {
      headerName: "Acciones",
      cellRenderer: 'actionsCellRenderer',
      cellRendererParams: {
        onInfo: handleInfo,
        onEdit: handleOpenModal,
        onDelete: handleDeleteClick,
      },
      flex: 0.5,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
    }
  ], []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Insumos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Insumo
        </button>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={insumos}
          columnDefs={columnDefs}
          loading={loading}
          components={{
            actionsCellRenderer: ActionsCellRenderer,
          }}
        />
      </div>

      <Transition
        show={modalOpen}
        as={React.Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <InsumoModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveInsumo}
          insumo={editingInsumo}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este insumo? Esta acción no se puede deshacer."
      />

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        item={selectedInsumo}
        title="Información del Insumo"
      />
    </div>
  );
}

export default InsumosPage;
