import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import InfoModal from './InfoModal';
import ConfirmDialog from './ConfirmDialog';
import DataGrid from './DataGrid';
import { PlusIcon, PencilIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const ActionsCellRenderer = ({ data, onInfo, onEdit, onDelete }) => (
  <div className="flex items-center justify-end space-x-2">
    <button data-testid="info-button" onClick={() => onInfo(data)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
      <InformationCircleIcon className="h-5 w-5" />
    </button>
    <button data-testid="edit-button" onClick={() => onEdit(data)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
      <PencilIcon className="h-5 w-5" />
    </button>
    <button data-testid="delete-button" onClick={() => onDelete(data.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

function CrudPage({
  services,
  columnDefsFactory,
  ModalComponent,
  entityName,
  entityNamePlural,
  infoTitle,
  modalEntityPropName = "entity",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const { addNotification } = useNotification();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await services.get();
      setItems(data);
    } catch (error) {
      addNotification(`Error al cargar ${entityNamePlural.toLowerCase()}: ${error.message}`, 'error');
      console.error(`Error fetching ${entityNamePlural.toLowerCase()}:`, error);
    } finally {
      setLoading(false);
    }
  }, [services, entityNamePlural]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (itemData) => {
    try {
      if (editingItem) {
        await services.update(editingItem.id, itemData);
        addNotification(`${entityName} actualizado con éxito`, 'success');
      } else {
        await services.add(itemData);
        addNotification(`${entityName} añadido con éxito`, 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      addNotification(`Error al guardar ${entityName.toLowerCase()}: ${error.message}`, 'error');
      console.error(`Error saving ${entityName.toLowerCase()}:`, error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingItemId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await services.delete(deletingItemId);
      addNotification(`${entityName} eliminado con éxito`, 'success');
      setConfirmOpen(false);
      setDeletingItemId(null);
      fetchData();
    } catch (error) {
      addNotification(`Error al eliminar ${entityName.toLowerCase()}: ${error.message}`, 'error');
      console.error(`Error deleting ${entityName.toLowerCase()}:`, error);
    }
  };

  const handleInfo = (item) => {
    setSelectedItem(item);
    setInfoModalOpen(true);
  };

  const columnDefs = useMemo(() => columnDefsFactory({
    onInfo: handleInfo,
    onEdit: handleOpenModal,
    onDelete: handleDeleteClick,
  }), [columnDefsFactory]);

  const modalProps = {
    open: modalOpen,
    onClose: handleCloseModal,
    onSave: handleSave,
    [modalEntityPropName]: editingItem,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{entityNamePlural}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Añadir {entityName}
        </button>
      </div>

      <div className="flex-grow bg-surface rounded-xl shadow-md p-4">
        <DataGrid
          rowData={items}
          columnDefs={columnDefs}
          loading={loading}
          components={{
            actionsCellRenderer: ActionsCellRenderer,
          }}
        />
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
        <ModalComponent {...modalProps} />
      </Transition>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Confirmar Eliminación`}
        message={`¿Estás seguro de que quieres eliminar este ${entityName.toLowerCase()}? Esta acción no se puede deshacer.`}
      />

      <InfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        item={selectedItem}
        title={infoTitle}
      />
    </div>
  );
}

export default CrudPage;
