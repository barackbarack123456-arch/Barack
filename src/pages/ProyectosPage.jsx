import React from 'react';
import { getProyectos, addProyecto, updateProyecto, deleteProyecto } from '../services/modules/proyectosService';
import ProyectoModal from '../components/ProyectoModal';
import CrudPage from '../components/CrudPage';

const ProyectosPage = () => {
  const services = {
    get: getProyectos,
    add: addProyecto,
    update: updateProyecto,
    delete: deleteProyecto,
  };

  const columnDefsFactory = ({ onEdit, onDelete, onInfo }) => [
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Nombre", field: "nombre", flex: 2, sortable: true, filter: true },
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
      ModalComponent={ProyectoModal}
      entityName="Proyecto"
      entityNamePlural="Proyectos"
      infoTitle="Información del Proyecto"
      modalEntityPropName="proyecto"
    />
  );
};

export default ProyectosPage;
