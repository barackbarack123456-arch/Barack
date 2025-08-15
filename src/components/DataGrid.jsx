import React from 'react';
import { AgGridReact } from '@ag-grid-community/react';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

function DataGrid({
  view,
  rowData,
  config,
  autoGroupColumnDef,
  onGridReady,
  onSelectionChanged,
  onCellValueChanged,
  handleRowDragEnd,
  getDataPath,
  isExternalFilterPresent,
  doesExternalFilterPass,
}) {
  return (
    <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
      <AgGridReact
        key={view} // Add key to force re-render on view change
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
  );
}

export default DataGrid;
