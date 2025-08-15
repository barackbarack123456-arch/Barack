import React, { useState, useMemo } from 'react';
import { getSinopticoItems, addSinopticoItem, updateSinopticoItem, deleteSinopticoItem } from '../services/sinopticoService';
import { getProveedores, updateProveedor } from '../services/modules/proveedoresService';
import { getClientes, updateCliente } from '../services/modules/clientesService';
import { getInsumos, updateInsumo } from '../services/modules/insumosService';
import { getProductos, updateProducto } from '../services/modules/productosService';
import useData from '../hooks/useData';
import SinopticoItemModal from '../components/SinopticoItemModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';

// AG Grid Module Registration
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
// Enterprise modules have been removed to prevent watermarks and build errors.
// The Sinoptico tree view functionality will be disabled until a proper Community-based solution is implemented.

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
]);

// Helper function to calculate the level of each node for the sinoptico view
const calculateLevels = (items) => {
  // This functionality is temporarily disabled as it depends on enterprise features.
  return items.map(item => ({ ...item, level: 1 }));
};

const VIEW_CONFIG = {
  sinoptico: {
    title: 'Sinóptico de Productos (Vista Plana)',
    fetcher: getSinopticoItems,
    updater: updateSinopticoItem,
    isTree: false, // Disabled tree view
    colDefs: [
      { field: 'nombre', headerName: 'Nombre', editable: true, flex: 1 },
      { field: 'comentarios', headerName: 'Comentarios', editable: true, flex: 1 },
      { field: 'cantidad', headerName: 'Cantidad', editable: true, valueParser: params => Number(params.newValue) || 0 },
      { field: 'unidad_medida', headerName: 'Unidad' },
    ]
  },
  clientes: {
    title: 'Clientes',
    fetcher: getClientes,
    updater: updateCliente,
    isTree: false,
    colDefs: [
      { field: 'nombre', headerName: 'Nombre', editable: true, flex: 1 },
      { field: 'email', headerName: 'Email', editable: true, flex: 1 },
      { field: 'telefono', headerName: 'Teléfono', editable: true, flex: 1 },
    ]
  },
  proveedores: {
    title: 'Proveedores',
    fetcher: getProveedores,
    updater: updateProveedor,
    isTree: false,
    colDefs: [
        { field: 'nombre', headerName: 'Nombre', editable: true, flex: 1 },
        { field: 'contacto', headerName: 'Contacto', editable: true, flex: 1 },
        { field: 'telefono', headerName: 'Teléfono', editable: true, flex: 1 },
    ]
  },
  insumos: {
    title: 'Insumos',
    fetcher: getInsumos,
    updater: updateInsumo,
    isTree: false,
    colDefs: [
        { field: 'nombre', headerName: 'Nombre', editable: true, flex: 1 },
        { field: 'proveedor', headerName: 'Proveedor', editable: true, flex: 1 },
        { field: 'stock', headerName: 'Stock', editable: true, type: 'numericColumn' },
    ]
  },
  productos: {
    title: 'Productos',
    fetcher: getProductos,
    updater: updateProducto,
    isTree: false,
    colDefs: [
        { field: 'nombre', headerName: 'Nombre', editable: true, flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', editable: true, flex: 2 },
        { field: 'precio', headerName: 'Precio', editable: true, type: 'numericColumn' },
    ]
  },
};


function SinopticoPage() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');
  const [currentView, setCurrentView] = useState('sinoptico');

  const config = useMemo(() => VIEW_CONFIG[currentView], [currentView]);

  // Use the custom hook for data fetching
  const { data: rawData, loading, refetch } = useData(config.fetcher, [currentView]);

  // Process data (e.g., calculate levels for tree view)
  const rowData = useMemo(() => {
    if (config.isTree) {
      return calculateLevels(rawData);
    }
    return rawData;
  }, [rawData, config.isTree]);

  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const onSelectionChanged = (event) => {
    const selectedNodes = event.api.getSelectedNodes();
    setSelectedItem(selectedNodes.length > 0 ? selectedNodes[0].data : null);
  };

  const handleAddRootItem = () => {
    if (gridApi) gridApi.deselectAll();
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleAddSubItem = () => {
    setIsModalOpen(true);
  };

  const handleSaveItem = async (formData) => {
    const itemData = { ...formData, id_padre: selectedItem ? selectedItem.id : null };
    await addSinopticoItem(itemData).catch(err => console.error("Failed to add item:", err));
    refetch(); // Refetch data for the current view
    setIsModalOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    await deleteSinopticoItem(selectedItem.id).catch(err => console.error("Failed to delete item:", err));
    refetch(); // Refetch data for the current view
    setIsConfirmOpen(false);
    setSelectedItem(null);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">{config.title}</h1>
            <div className="flex items-center gap-2">
                <span className="font-medium">Vistas:</span>
                {Object.keys(VIEW_CONFIG).map(view => (
                    <button key={view} onClick={() => setCurrentView(view)} className={`px-3 py-1 rounded-md capitalize ${currentView === view ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                        {view}
                    </button>
                ))}
            </div>
        </div>

      {currentView === 'sinoptico' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <button onClick={handleAddRootItem} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Añadir Producto</button>
            <button onClick={handleAddSubItem} disabled={!selectedItem} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Añadir Sub-componente</button>
            <button onClick={() => setIsConfirmOpen(true)} disabled={!selectedItem} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Eliminar Seleccionado</button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="font-medium">Filtrar por Nivel:</span>
              <button onClick={() => setLevelFilter('all')} className={`px-3 py-1 rounded-md ${levelFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Todos</button>
              <button onClick={() => setLevelFilter(1)} className={`px-3 py-1 rounded-md ${levelFilter === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>1</button>
              <button onClick={() => setLevelFilter(2)} className={`px-3 py-1 rounded-md ${levelFilter === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>2</button>
              <button onClick={() => setLevelFilter('3+')} className={`px-3 py-1 rounded-md ${levelFilter === '3+' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>3+</button>
            </div>
        </div>
      )}

      <DataGrid
        rowData={loading ? [] : rowData}
        columnDefs={config.colDefs}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
      />

      {currentView === 'sinoptico' && (
        <>
          <SinopticoItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} item={null} />
          <ConfirmDialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDeleteItem} title="Confirmar Eliminación" message={`¿Estás seguro de que quieres eliminar "${selectedItem?.nombre}"? Esta acción no se puede deshacer.`}/>
        </>
      )}
    </div>
  );
}

export default SinopticoPage;
