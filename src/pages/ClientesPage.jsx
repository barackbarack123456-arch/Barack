import React from 'react';
import { getClientes, addCliente, updateCliente, deleteCliente } from '../services/modules/clientesService';
import ClienteModal from '../components/ClienteModal';
import CrudPage from '../components/CrudPage';

const ClientesPage = () => {
  const services = {
    get: getClientes,
    add: addCliente,
    update: updateCliente,
    delete: deleteCliente,
  };

  const columnDefsFactory = ({ onEdit, onDelete, onInfo }) => [
    { headerName: "Nombre", field: "nombre", flex: 2, sortable: true, filter: true },
    { headerName: "Dirección", field: "direccion", flex: 2, sortable: true, filter: true },
    { headerName: "Teléfono", field: "telefono", flex: 1, sortable: true, filter: true },
    { headerName: "Email", field: "email", flex: 2, sortable: true, filter: true },
    {
      headerName: "Acciones",
      cellRenderer: 'actionsCellRenderer',
      cellRendererParams: {
        onInfo,
        onEdit,
        onDelete,
      },
      flex: 0.5,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
    }
  ];

  return (
    <CrudPage
      services={services}
      columnDefsFactory={columnDefsFactory}
      ModalComponent={ClienteModal}
      entityName="Cliente"
      entityNamePlural="Clientes"
      infoTitle="Información del Cliente"
      modalEntityPropName="cliente"
    />
  );
};

export default ClientesPage;
