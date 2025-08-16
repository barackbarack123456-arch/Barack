import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getSubproductos, addSubproducto, updateSubproducto, deleteSubproducto } from '../services/modules/subproductosService';
import SubproductoModal from '../components/SubproductoModal';
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

function SubproductosPage() {
  const [subproductos, setSubproductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubproducto, setEditingSubproducto] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedSubproducto, setSelectedSubproducto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingSubproductoId, setDeletingSubproductoId] = useState(null);

  const fetchSubproductos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubproductos();
      setSubproductos(data);
    } catch (error) {
      console.error("Error fetching subproducts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubproductos();
  }, [fetchSubproductos]);

  const handleOpenModal = (subproducto = null) => {
    setEditingSubproducto(subproducto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSubproducto(null);
  };

  const handleSaveSubproducto = async (subproductoData) => {
    try {
      if (editingSubproducto) {
        await updateSubproducto(editingSubproducto.id, subproductoData);
      } else {
        await addSubproducto(subproductoData);
      }
      handleCloseModal();
      fetchSubproductos();
    } catch (error) {
      console.error("Error saving subproduct:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingSubproductoId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSubproducto(deletingSubproductoId);
      setConfirmOpen(false);
      setDeletingSubproductoId(null);
      fetchSubproductos();
    } catch (error) {
      console.error("Error deleting subproduct:", error);
    }
  };

  const handleInfo = (subproducto) => {
    setSelectedSubproducto(subproducto);
    setInfoModalOpen(true);
  };

  const columnDefs = useMemo(() => [
    { headerName: "Nombre", field: "nombre", flex: 1, sortable: true, filter: true },
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Descripción", field: "descripcion", flex: 2, sortable: true, filter: true },
    { headerName: "Peso", field: "peso", flex: 1, sortable: true, filter: true },
    { headerName: "Medidas", field: "medidas", flex: 1, sortable: true, filter: true },
    { headerName: "Unidad de Medida", field: "unidad_medida", flex: 1, sortable: true, filter: true },
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
        <h1 className="text-3xl font-bold text-gray-800">Subproductos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Subproducto
        </button>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={subproductos}
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
        <SubproductoModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveSubproducto}
          subproducto={editingSubproducto}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este subproducto? Esta acción no se puede deshacer."
      />

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        item={selectedSubproducto}
        title="Información del Subproducto"
      />
    </div>
  );
}

export default SubproductosPage;
