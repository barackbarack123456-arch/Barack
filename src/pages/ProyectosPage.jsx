import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getProyectos, addProyecto, updateProyecto, deleteProyecto } from '../services/modules/proyectosService';
import ProyectoModal from '../components/ProyectoModal';
import InfoModal from '../components/InfoModal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataGrid from '../components/DataGrid';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';
import ActionsCellRenderer from '../components/ActionsCellRenderer';
import GridSkeletonLoader from '../components/GridSkeletonLoader';
import EmptyState from '../components/EmptyState';

function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProyectoId, setDeletingProyectoId] = useState(null);

  const fetchProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProyectos();
      setProyectos(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const handleOpenModal = (proyecto = null) => {
    setEditingProyecto(proyecto);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProyecto(null);
  };

  const handleSaveProyecto = async (proyectoData) => {
    try {
      if (editingProyecto) {
        await updateProyecto(editingProyecto.id, proyectoData);
      } else {
        await addProyecto(proyectoData);
      }
      handleCloseModal();
      fetchProyectos();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingProyectoId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProyecto(deletingProyectoId);
      setConfirmOpen(false);
      setDeletingProyectoId(null);
      fetchProyectos();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleInfo = (proyecto) => {
    setSelectedProyecto(proyecto);
    setInfoModalOpen(true);
  };

  const columnDefs = useMemo(() => [
    { headerName: "Código", field: "codigo", flex: 1, sortable: true, filter: true },
    { headerName: "Nombre", field: "nombre", flex: 2, sortable: true, filter: true },
    {
      headerName: "Acciones",
      cellRenderer: 'actionsCellRenderer',
      cellRendererParams: {
        onInfo: handleInfo,
        onEdit: handleOpenModal,
        onDelete: handleDeleteClick,
      },
      flex: 0.5,
      sortable: false,
      filter: false,
      resizable: false,
      pinned: 'right',
    }
  ], []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Proyectos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir Proyecto
        </button>
      </div>

      <div className="flex-grow flex flex-col">
        {loading ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden flex-grow">
            <GridSkeletonLoader />
          </div>
        ) : proyectos.length === 0 ? (
          <EmptyState
            title="No hay proyectos"
            message="Empieza por añadir tu primer proyecto para empezar a gestionarlos."
            actionText="Añadir Proyecto"
            onAction={() => handleOpenModal()}
          />
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden flex-grow">
            <DataGrid
              rowData={proyectos}
              columnDefs={columnDefs}
              components={{
                actionsCellRenderer: ActionsCellRenderer,
              }}
            />
          </div>
        )}
      </div>

      <Transition
        show={modalOpen}
        as={React.Fragment}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <ProyectoModal
          open={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProyecto}
          proyecto={editingProyecto}
        />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer."
      />

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        item={selectedProyecto}
        title="Información del Proyecto"
      />
    </div>
  );
}

export default ProyectosPage;
