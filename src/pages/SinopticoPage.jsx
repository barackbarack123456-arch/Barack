import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { getSinopticoItems, addSinopticoItem, updateSinopticoItem, deleteSinopticoItem } from '../services/sinopticoService';
import { getProveedores, updateProveedor, getClientes, updateCliente, getInsumos, updateInsumo, getProductos, updateProducto } from '../services/dataService';
import SinopticoItemModal from '../components/SinopticoItemModal';
import ConfirmDialog from '../components/ConfirmDialog';

// AG Grid Module Registration
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';

// AG Grid License Note:
// The "AG Grid Enterprise" watermark is displayed because the application is running in a development environment
// without a license key. All enterprise features are unlocked for trial purposes.
// For production use, a license key is required to remove the watermark and console logs.
// For more information, please visit https://www.ag-grid.com/license-pricing.php

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowGroupingModule,
  MenuModule,
  SetFilterModule,
  ColumnsToolPanelModule,
]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

// Helper function to calculate the level of each node for the sinoptico view
const calculateLevels = (items) => {
  const itemMap = new Map(items.map(item => [item.id, { ...item, children: [] }]));
  const roots = [];

  items.forEach(item => {
    if (item.id_padre && itemMap.has(item.id_padre)) {
      itemMap.get(item.id_padre).children.push(itemMap.get(item.id));
    } else {
      roots.push(itemMap.get(item.id));
    }
  });

  const setLevel = (node, level) => {
    node.level = level;
    node.children.forEach(child => setLevel(child, level + 1));
  };

  roots.forEach(root => setLevel(root, 1));

  return items.map(item => ({ ...item, level: itemMap.get(item.id).level }));
};

const VIEW_CONFIG = {
  sinoptico: {
    title: 'Sinóptico de Productos',
    fetcher: getSinopticoItems,
    updater: updateSinopticoItem,
    isTree: true,
    colDefs: [
      { field: 'comentarios', headerName: 'Comentarios', editable: true, flex: 1 },
      { field: 'cantidad', headerName: 'Cantidad', editable: true, valueParser: params => Number(params.newValue) || 0 },
      { field: 'unidad_medida', headerName: 'Unidad' },
      { field: 'level', headerName: 'Nivel', hide: true },
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
  const [rowData, setRowData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');
  const [currentView, setCurrentView] = useState('sinoptico');
  const [loading, setLoading] = useState(true);

  // Suggestion for improvement: Centralize data fetching logic, perhaps in a custom hook (e.g., useData)
  // to handle loading, error, and data states automatically for all views.
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = VIEW_CONFIG[currentView];
      let items = await config.fetcher();
      if (config.isTree) {
        items = calculateLevels(items);
      }
      setRowData(items);
    } catch (error) {
      console.error(`Error fetching ${currentView} items:`, error);
      setRowData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [currentView]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (gridApi) {
      gridApi.onFilterChanged();
    }
  }, [levelFilter, gridApi]);


  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const getDataPath = useCallback((data) => {
    const path = [];
    const itemMap = new Map(rowData.map(item => [item.id, item]));
    let currentItem = data;
    while (currentItem) {
      path.unshift(currentItem.id);
      currentItem = itemMap.get(currentItem.id_padre);
    }
    return path;
  }, [rowData]);

  const onCellValueChanged = useCallback(async (params) => {
    const { data, colDef, newValue } = params;
    const config = VIEW_CONFIG[currentView];
    if (!config.updater) {
      console.error(`No updater configured for view: ${currentView}`);
      return;
    }
    try {
      const updateData = { [colDef.field]: newValue };
      await config.updater(data.id, updateData);
    } catch (err) {
      console.error("Failed to update item:", err);
      // Optional: revert cell value on failure
      params.api.refreshCells({ rowNodes: [params.node], force: true });
    }
  }, [currentView]);

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
    fetchData(); // Refetch data for the current view
    setIsModalOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    await deleteSinopticoItem(selectedItem.id).catch(err => console.error("Failed to delete item:", err));
    fetchData(); // Refetch data for the current view
    setIsConfirmOpen(false);
    setSelectedItem(null);
  };

  const handleRowDragEnd = useCallback(async (event) => {
    const movingNode = event.node;
    const overNode = event.overNode;
    const newParentId = overNode ? overNode.data.id : null;
    if (movingNode.data.id === newParentId || movingNode.data.id_padre === newParentId) return;
    const updateData = { id_padre: newParentId };
    await updateSinopticoItem(movingNode.data.id, updateData);
    fetchData();
  }, [fetchData]);

  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'Nombre',
    field: 'nombre',
    cellRendererParams: { suppressCount: true },
    flex: 1,
    filter: true,
    rowDrag: VIEW_CONFIG[currentView].isTree, // Only allow drag for tree view
  }), [currentView]);

  const isExternalFilterPresent = useCallback(() => levelFilter !== 'all', [levelFilter]);

  const doesExternalFilterPass = useCallback((node) => {
    if (levelFilter === '3+') {
      return node.data.level >= 3;
    }
    return node.data.level === levelFilter;
  }, [levelFilter]);

  const config = VIEW_CONFIG[currentView];

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

      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          key={currentView} // Add key to force re-render on view change
          rowData={rowData}
          columnDefs={config.colDefs}
          treeData={config.isTree}
          getDataPath={config.isTree ? getDataPath : undefined}
          autoGroupColumnDef={autoGroupColumnDef}
          groupDefaultExpanded={-1}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          onGridReady={onGridReady}
          rowSelection="single"
          onRowDragEnd={config.isTree ? handleRowDragEnd : undefined}
          isExternalFilterPresent={config.isTree ? isExternalFilterPresent : () => false}
          doesExternalFilterPass={config.isTree ? doesExternalFilterPass : undefined}
          getRowId={params => params.data.id} // Important for data updates
          overlayLoadingTemplate='<span class="ag-overlay-loading-center">Cargando...</span>'
          overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">No hay datos para mostrar.</span>'
        />
      </div>

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
