import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getProductos, addProducto, updateProducto, deleteProducto } from '../services/modules/productosService';
import ProductoModal from '../components/ProductoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProductoId, setDeletingProductoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

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

  const columnDefs = useMemo(() => [
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Descripción", field: "descripcion", flex: 2, sortable: true, filter: true },
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
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Producto
        </button>
      </div>

      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={productos}
          columnDefs={columnDefs}
          frameworkComponents={{
            actionsCellRenderer: ActionsCellRenderer,
          }}
          loading={loading}
        />
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
