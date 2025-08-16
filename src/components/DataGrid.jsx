import React from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-balham.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

function DataGrid({
  rowData,
  columnDefs,
  onGridReady,
  onSelectionChanged,
  loading,
  components,
  treeData,
  getDataPath,
  autoGroupColumnDef,
  getRowIdKey = 'id',
  overlayLoadingTemplate = '<span class="ag-overlay-loading-center">Cargando...</span>',
  overlayNoRowsTemplate = '<span class="ag-overlay-no-rows-center">No hay datos para mostrar.</span>',
  defaultColDef: customDefaultColDef,
}) {
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    ...customDefaultColDef,
  };

  const getRowId = params => params.data[getRowIdKey];

  return (
    <div className="ag-theme-balham" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
        treeData={treeData}
        getDataPath={getDataPath}
        autoGroupColumnDef={autoGroupColumnDef}
        getRowId={getRowId}
        loading={loading}
        components={components}
        overlayLoadingTemplate={overlayLoadingTemplate}
        overlayNoRowsTemplate={overlayNoRowsTemplate}
        domLayout='autoHeight'
      />
    </div>
  );
}

export default DataGrid;
