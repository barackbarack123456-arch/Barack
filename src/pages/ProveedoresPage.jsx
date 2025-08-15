import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getProveedores, addProveedor, updateProveedor, deleteProveedor } from '../services/modules/proveedoresService';
import { useAuth } from '../hooks/useAuth';
import ProveedorModal from '../components/ProveedorModal';
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

function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProveedorId, setDeletingProveedorId] = useState(null);
  const { currentUser } = useAuth();

  const fetchProveedores = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getProveedores(currentUser.uid);
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const handleOpenModal = (proveedor = null) => {
    setEditingProveedor(proveedor);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProveedor(null);
  };

  const handleSaveProveedor = async (proveedorData) => {
    if (!currentUser) {
      console.error("No user logged in");
      return;
    }
    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, proveedorData);
      } else {
        await addProveedor(proveedorData, currentUser.uid);
      }
      handleCloseModal();
      fetchProveedores();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingProveedorId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProveedor(deletingProveedorId);
      setConfirmOpen(false);
      setDeletingProveedorId(null);
      fetchProveedores();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  const handleInfo = (proveedor) => {
    setSelectedProveedor(proveedor);
    setInfoModalOpen(true);
  };

  const columnDefs = useMemo(() => [
    { headerName: "Razón Social", field: "razonSocial", flex: 2, sortable: true, filter: true },
    { headerName: "Dirección", field: "direccion", flex: 2, sortable: true, filter: true },
    { headerName: "Teléfono", field: "telefono", flex: 1, sortable: true, filter: true },
    { headerName: "Email", field: "email", flex: 2, sortable: true, filter: true },
    { headerName: "Contacto", field: "contacto", flex: 1, sortable: true, filter: true },
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
        <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Proveedor
        </button>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={proveedores}
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
        <ProveedorModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProveedor}
          proveedor={editingProveedor}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer."
      />

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        item={selectedProveedor}
        title="Información del Proveedor"
      />
    </div>
  );
}

export default ProveedoresPage;
