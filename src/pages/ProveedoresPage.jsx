import React from 'react';
import { getProveedores, addProveedor, updateProveedor, deleteProveedor } from '../services/modules/proveedoresService';
import ProveedorModal from '../components/ProveedorModal';
import CrudPage from '../components/CrudPage';

const ProveedoresPage = () => {
  const services = {
    get: getProveedores,
    add: addProveedor,
    update: updateProveedor,
    delete: deleteProveedor,
  };

  const columnDefsFactory = ({ onEdit, onDelete, onInfo }) => [
    { headerName: "Razón Social", field: "razonSocial", flex: 2, sortable: true, filter: true },
    { headerName: "Dirección", field: "direccion", flex: 2, sortable: true, filter: true },
    { headerName: "Teléfono", field: "telefono", flex: 1, sortable: true, filter: true },
    { headerName: "Email", field: "email", flex: 2, sortable: true, filter: true },
    { headerName: "Contacto", field: "contacto", flex: 1, sortable: true, filter: true },
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
      ModalComponent={ProveedorModal}
      entityName="Proveedor"
      entityNamePlural="Proveedores"
      infoTitle="Información del Proveedor"
      modalEntityPropName="proveedor"
    />
  );
};

export default ProveedoresPage;
