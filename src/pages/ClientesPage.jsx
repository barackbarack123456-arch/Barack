import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getClientes, addCliente, updateCliente, deleteCliente } from '../services/modules/clientesService';
import ClienteModal from '../components/ClienteModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const ActionsCellRenderer = ({ data, onEdit, onDelete }) => (
  <div className="flex items-center justify-end space-x-2">
    <button onClick={() => onEdit(data)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
      <PencilIcon className="h-5 w-5" />
    </button>
    <button onClick={() => onDelete(data.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingClienteId, setDeletingClienteId] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleOpenModal = (cliente = null) => {
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCliente(null);
  };

  const handleSaveCliente = async (clienteData) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, clienteData);
      } else {
        await addCliente(clienteData);
      }
      handleCloseModal();
      fetchClientes();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingClienteId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCliente(deletingClienteId);
      setConfirmOpen(false);
      setDeletingClienteId(null);
      fetchClientes();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const columnDefs = useMemo(() => [
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Nombre", field: "nombre", flex: 2, sortable: true, filter: true },
    {
      headerName: "Acciones",
      cellRenderer: 'actionsCellRenderer',
      cellRendererParams: {
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
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Cliente
        </button>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={clientes}
          columnDefs={columnDefs}
          loading={loading}
          frameworkComponents={{
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
        <ClienteModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCliente}
          cliente={editingCliente}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default ClientesPage;
