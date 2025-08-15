import React, { useState, useEffect } from 'react';
import { getClientes, addCliente, updateCliente, deleteCliente } from '../services/dataService';
import ClienteModal from '../components/ClienteModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingClienteId, setDeletingClienteId] = useState(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Cliente
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
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay clientes para mostrar.</td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(cliente)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(cliente.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ClienteModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCliente}
        cliente={editingCliente}
      />
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
