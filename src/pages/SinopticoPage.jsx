import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { getSinopticoItems, addSinopticoItem, updateSinopticoItem, deleteSinopticoItem } from '../services/sinopticoService';
import SinopticoItemModal from '../components/SinopticoItemModal';
import ConfirmDialog from '../components/ConfirmDialog';

// AG Grid Module Registration
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowGroupingModule,
  MenuModule,
  SetFilterModule,
  ColumnsToolPanelModule,
]);

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

// Helper function to calculate the level of each node
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


function SinopticoPage() {
  const [rowData, setRowData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [levelFilter, setLevelFilter] = useState('all');

  const fetchItems = useCallback(async () => {
    try {
      const items = await getSinopticoItems();
      const itemsWithLevels = calculateLevels(items);
      setRowData(itemsWithLevels);
    } catch (error) {
      console.error("Error fetching sinoptico items:", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (gridApi) {
      gridApi.onFilterChanged();
    }
  }, [levelFilter, gridApi]);


  const onGridReady = (params) => {
    setGridApi(params.api);
  };

  const [colDefs] = useState([
    { field: 'comentarios', headerName: 'Comentarios', editable: true, flex: 1 },
    { field: 'cantidad', headerName: 'Cantidad', editable: true, valueParser: params => Number(params.newValue) || 0 },
    { field: 'unidad_medida', headerName: 'Unidad' },
    { field: 'level', headerName: 'Nivel', hide: true },
  ]);

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
    const updateData = { [colDef.field]: newValue };
    await updateSinopticoItem(data.id, updateData).catch(err => console.error("Failed to update item:", err));
  }, []);

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
    fetchItems();
    setIsModalOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    await deleteSinopticoItem(selectedItem.id).catch(err => console.error("Failed to delete item:", err));
    fetchItems();
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
    fetchItems();
  }, [fetchItems]);

  const autoGroupColumnDef = useMemo(() => ({
    headerName: 'Nombre',
    field: 'nombre',
    cellRendererParams: { suppressCount: true },
    flex: 1,
    filter: true,
    rowDrag: true,
  }), []);

  const isExternalFilterPresent = useCallback(() => levelFilter !== 'all', [levelFilter]);

  const doesExternalFilterPass = useCallback((node) => {
    if (levelFilter === '3+') {
      return node.data.level >= 3;
    }
    return node.data.level === levelFilter;
  }, [levelFilter]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Sinóptico de Productos</h1>

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

      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={colDefs}
          treeData={true}
          getDataPath={getDataPath}
          autoGroupColumnDef={autoGroupColumnDef}
          groupDefaultExpanded={-1}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          onGridReady={onGridReady}
          rowSelection="single"
          onRowDragEnd={handleRowDragEnd}
          isExternalFilterPresent={isExternalFilterPresent}
          doesExternalFilterPass={doesExternalFilterPass}
        />
      </div>

      <SinopticoItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} item={null} />
      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDeleteItem} title="Confirmar Eliminación" message={`¿Estás seguro de que quieres eliminar "${selectedItem?.nombre}"? Esta acción no se puede deshacer.`}/>
    </div>
  );
}

export default SinopticoPage;
