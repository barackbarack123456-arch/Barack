import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getClientes, addCliente, updateCliente, deleteCliente } from '../services/dataService';
import ClienteModal from '../components/ClienteModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingClienteId, setDeletingClienteId] = useState(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("No se pudieron cargar los clientes. Por favor, intente de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cuit.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientes, searchTerm]);

  const handleOpenModal = (cliente = null) => {
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCliente(null);
  };

  const handleSaveCliente = async (clienteData) => {
    const isEditing = !!editingCliente;
    const promise = isEditing
      ? updateCliente(editingCliente.id, clienteData)
      : addCliente(clienteData);

    toast.promise(promise, {
      loading: 'Guardando...',
      success: `Cliente ${isEditing ? 'actualizado' : 'añadido'} con éxito.`,
      error: 'Error al guardar el cliente.',
    });

    try {
      await promise;
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
    const promise = deleteCliente(deletingClienteId);

    toast.promise(promise, {
      loading: 'Eliminando...',
      success: 'Cliente eliminado con éxito.',
      error: 'Error al eliminar el cliente.',
    });

    try {
      await promise;
      setConfirmOpen(false);
      setDeletingClienteId(null);
      fetchClientes();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Cliente
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CUIT</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 animate-pulse">Cargando...</td>
              </tr>
            ) : filteredClientes.length > 0 ? (
              filteredClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.cuit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.direccion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenModal(cliente)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(cliente.id)} className="text-red-600 hover:text-red-900 transition-colors duration-150">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes para mostrar. Añade uno para empezar.'}
                </td>
              </tr>
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
