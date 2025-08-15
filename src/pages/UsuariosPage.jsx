import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getUsuarios, updateUsuario, deleteUsuario } from '../services/modules/usuariosService';
import UsuarioModal from '../components/UsuarioModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const ActionsCellRenderer = ({ data, onEdit, onDelete }) => (
  <div className="flex items-center justify-end space-x-2">
    <button data-testid="edit-button" onClick={() => onEdit(data)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
      <PencilIcon className="h-5 w-5" />
    </button>
    <button data-testid="delete-button" onClick={() => onDelete(data.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingUsuarioId, setDeletingUsuarioId] = useState(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleOpenModal = (usuario = null) => {
    setEditingUsuario(usuario);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUsuario(null);
  };

  const handleSaveUsuario = async (usuarioData) => {
    try {
      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, usuarioData);
      }
      handleCloseModal();
      fetchUsuarios();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingUsuarioId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUsuario(deletingUsuarioId);
      setConfirmOpen(false);
      setDeletingUsuarioId(null);
      fetchUsuarios();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const columnDefs = useMemo(() => [
    { headerName: "Email", field: "email", flex: 2, sortable: true, filter: true },
    { headerName: "Rol", field: "role", flex: 1, sortable: true, filter: true },
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
        <h1 className="text-3xl font-bold text-gray-800">Usuarios</h1>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={usuarios}
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
        <UsuarioModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUsuario}
          usuario={editingUsuario}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default UsuariosPage;
