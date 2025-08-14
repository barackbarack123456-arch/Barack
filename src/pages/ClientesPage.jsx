import React from 'react';
import DataTable from '../components/DataTable';
import { schemas } from '../schemas';

function ClientesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Gestión de Clientes</h1>
      <DataTable
        collectionName="clientes"
        schema={schemas.clientes}
      />
    </div>
  );
}

export default ClientesPage;
