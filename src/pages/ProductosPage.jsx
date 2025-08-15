import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getProductos, addProducto, updateProducto, deleteProducto } from '../services/dataService';
import ProductoModal from '../components/ProductoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProductoId, setDeletingProductoId] = useState(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("No se pudieron cargar los productos. Por favor, intente de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const filteredProductos = useMemo(() => {
    return productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productos, searchTerm]);

  const handleOpenModal = (producto = null) => {
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProducto(null);
  };

  const handleSaveProducto = async (productoData) => {
    const isEditing = !!editingProducto;
    const promise = isEditing
      ? updateProducto(editingProducto.id, productoData)
      : addProducto(productoData);

    toast.promise(promise, {
      loading: 'Guardando...',
      success: `Producto ${isEditing ? 'actualizado' : 'añadido'} con éxito.`,
      error: 'Error al guardar el producto.',
    });

    try {
      await promise;
      handleCloseModal();
      fetchProductos();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingProductoId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const promise = deleteProducto(deletingProductoId);

    toast.promise(promise, {
      loading: 'Eliminando...',
      success: 'Producto eliminado con éxito.',
      error: 'Error al eliminar el producto.',
    });

    try {
      await promise;
      setConfirmOpen(false);
      setDeletingProductoId(null);
      fetchProductos();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Producto
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 animate-pulse">Cargando...</td>
              </tr>
            ) : filteredProductos.length > 0 ? (
              filteredProductos.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(producto.precio)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{producto.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenModal(producto)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(producto.id)} className="text-red-600 hover:text-red-900 transition-colors duration-150">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay productos para mostrar. Añade uno para empezar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductoModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProducto}
        producto={editingProducto}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
      />
    </div>
  );
}

export default ProductosPage;
