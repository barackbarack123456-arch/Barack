import React, { useState, useMemo, useCallback } from 'react';
import { getSinopticoItems } from '../services/sinopticoService';
import useData from '../hooks/useData';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import Caratula from '../components/Caratula';
import ProductoModal from '../components/ProductoModal';
import SubproductoModal from '../components/SubproductoModal';
import InsumoModal from '../components/InsumoModal';
import { addProducto, updateProducto, deleteProducto } from '../services/modules/productosService';
import { addSubproducto, updateSubproducto, deleteSubproducto } from '../services/modules/subproductosService';
import { addInsumo, updateInsumo, deleteInsumo } from '../services/modules/insumosService';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// AG Grid Module Registration
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-theme-balham.css';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowGroupingModule,
]);

function SinopticoPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemType, setItemType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  const { data: rowData, loading, refetch } = useData(getSinopticoItems);

  const handleOpenModal = (item = null, type) => {
    setEditingItem(item);
    setItemType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setItemType(null);
  };

  const handleSave = async (formData) => {
    const data = { ...formData, id_padre: itemType !== 'producto' ? selectedItem?.id : null };
    try {
      if (editingItem) {
        switch (itemType) {
          case 'producto': await updateProducto(editingItem.id, data); break;
          case 'subproducto': await updateSubproducto(editingItem.id, data); break;
          case 'insumo': await updateInsumo(editingItem.id, data); break;
          default: break;
        }
      } else {
        switch (itemType) {
          case 'producto': await addProducto(data); break;
          case 'subproducto': await addSubproducto(data); break;
          case 'insumo': await addInsumo(data); break;
          default: break;
        }
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error(`Error saving ${itemType}:`, error);
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      switch (selectedItem.type) {
        case 'producto': await deleteProducto(selectedItem.id); break;
        case 'subproducto': await deleteSubproducto(selectedItem.id); break;
        case 'insumo': await deleteInsumo(selectedItem.id); break;
        default: break;
      }
      setIsConfirmOpen(false);
      setSelectedItem(null);
      refetch();
    } catch (error) {
      console.error(`Error deleting ${selectedItem.type}:`, error);
    }
  };

  const ActionsCellRenderer = ({ data }) => (
    <div className="flex items-center justify-end space-x-2">
      <button onClick={() => handleOpenModal(data, data.type)} className="text-indigo-600 hover:text-indigo-900">
        <PencilIcon className="h-5 w-5" />
      </button>
      <button onClick={() => handleDeleteClick(data)} className="text-red-600 hover:text-red-900">
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  const columnDefs = useMemo(() => [
    { field: 'codigo', headerName: 'Código', valueGetter: p => p.data.codigo || 'N/A' },
    { field: 'descripcion', headerName: 'Descripción', valueGetter: p => p.data.descripcion || 'N/A' },
    { field: 'peso', headerName: 'Peso', valueGetter: p => p.data.peso || 'N/A' },
    { field: 'medidas', headerName: 'Medidas', valueGetter: p => p.data.medidas || 'N/A' },
    { field: 'unidad_medida', headerName: 'Unidad', valueGetter: p => p.data.unidad_medida || 'N/A' },
    {
      headerName: "Acciones",
      cellRenderer: ActionsCellRenderer,
      pinned: 'right',
      width: 100,
    }
  ], []);

  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'Nombre',
    minWidth: 300,
    cellRendererParams: { suppressCount: true },
    valueGetter: p => p.data.nombre,
  }), []);

  const getDataPath = useCallback((data) => data.dataPath, []);

  const onGridReady = (params) => setGridApi(params.api);

  const onSelectionChanged = (event) => {
    const selectedNodes = event.api.getSelectedNodes();
    setSelectedItem(selectedNodes.length > 0 ? selectedNodes[0].data : null);
  };

  const renderModal = () => {
    if (!isModalOpen) return null;
    switch (itemType) {
      case 'producto': return <ProductoModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} producto={editingItem} />;
      case 'subproducto': return <SubproductoModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} subproducto={editingItem} />;
      case 'insumo': return <InsumoModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSave} insumo={editingItem} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Caratula />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => handleOpenModal(null, 'producto')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Añadir Producto</button>
        <button onClick={() => handleOpenModal(null, 'subproducto')} disabled={!selectedItem || selectedItem.type === 'insumo'} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">Añadir Subproducto</button>
        <button onClick={() => handleOpenModal(null, 'insumo')} disabled={!selectedItem || selectedItem.type === 'insumo'} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-gray-400">Añadir Insumo</button>
      </div>
      <div className="flex-grow bg-white shadow-lg rounded-lg overflow-hidden">
        <DataGrid
          rowData={rowData}
          loading={loading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          treeData={true}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          components={{ ActionsCellRenderer }}
        />
      </div>
      {renderModal()}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar "${selectedItem?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}

export default SinopticoPage;
