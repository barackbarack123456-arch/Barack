import React, { useState, useEffect } from 'react';
import { getProductos, addProducto, updateProducto, deleteProducto } from '../services/dataService';
import ProductoModal from '../components/ProductoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProductoId, setDeletingProductoId] = useState(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleOpenModal = (producto = null) => {
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProducto(null);
  };

  const handleSaveProducto = async (productoData) => {
    try {
      if (editingProducto) {
        await updateProducto(editingProducto.id, productoData);
      } else {
        await addProducto(productoData);
      }
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
    try {
      await deleteProducto(deletingProductoId);
      setConfirmOpen(false);
      setDeletingProductoId(null);
      fetchProductos();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Producto
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
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No hay productos para mostrar.</td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr key={producto.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.descripcion}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(producto)} className="text-indigo-600 hover:text-indigo-900">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(producto.id)} className="text-red-600 hover:text-red-900 ml-4">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
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
