import React from 'react';
import { AgGridReact } from '@ag-grid-community/react';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

function DataGrid({
  rowData,
  columnDefs,
  onGridReady,
  onSelectionChanged,
  loading,
  frameworkComponents,
}) {
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onSelectionChanged={onSelectionChanged}
        getRowId={params => params.data.id}
        loading={loading}
        frameworkComponents={frameworkComponents}
        overlayLoadingTemplate='<span class="ag-overlay-loading-center">Cargando...</span>'
        overlayNoRowsTemplate='<span class="ag-overlay-no-rows-center">No hay datos para mostrar.</span>'
        domLayout='autoHeight'
      />
    </div>
  );
}

export default DataGrid;
