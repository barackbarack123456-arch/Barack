import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react';

// Helper to get all descendant IDs to prevent circular dependencies
const getDescendantIds = (itemId, allItemsMap) => {
  let descendants = new Set();
  let queue = [itemId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    descendants.add(currentId);
    const children = Array.from(allItemsMap.values()).filter(i => i.parentId === currentId);
    for (const child of children) {
      queue.push(child.id);
    }
  }
  return descendants;
};

function SinopticoItemModal({ isOpen, onClose, onSave, item, allItems, parentId: initialParentId, type: initialType, rootProductId: initialRootProductId }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: item?.nombre || item?.descripcion || '',
        codigo: item?.codigo || '',
        peso: item?.peso || '',
        medidas: item?.medidas || '',
        parentId: item?.parentId || initialParentId || null,
        type: item?.type || initialType || 'subproducto',
        rootProductId: item?.rootProductId || initialRootProductId || null,
      });
    }
  }, [item, isOpen, initialParentId, initialType, initialRootProductId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      // If the parent is changing, we must also update the rootProductId
      if (name === 'parentId') {
        const newParent = allItems.find(i => i.id === value);
        // The new root is the parent's root, or the parent itself if it's a top-level product
        newFormData.rootProductId = newParent ? (newParent.rootProductId || newParent.id) : null;
      }
      return newFormData;
    });
  };

  const handleSave = () => {
    onSave(formData, item?.id);
    onClose();
  };

  const allItemsMap = new Map(allItems.map(i => [i.id, i]));
  const descendantIds = item ? getDescendantIds(item.id, allItemsMap) : new Set();

  const possibleParents = allItems.filter(p => !descendantIds.has(p.id) && p.type !== 'insumo');

  const hasChildren = item ? allItems.some(i => i.parentId === item.id) : false;

  return (
    <Transition show={isOpen}>
      <Dialog className="relative z-10" onClose={onClose}>
        {/* ... (Transition and backdrop) ... */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                  {item ? 'Editar Item' : 'Añadir Nuevo Item'}
                </DialogTitle>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                  {/* Fields */}
                  <div className="sm:col-span-2">
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" name="nombre" id="nombre" value={formData.nombre || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">Código</label>
                    <input type="text" name="codigo" id="codigo" value={formData.codigo || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                   <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                    <select name="type" id="type" value={formData.type || 'subproducto'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                      <option value="subproducto">Subproducto</option>
                      <option value="insumo" disabled={hasChildren}>Insumo (no puede tener hijos)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="peso" className="block text-sm font-medium text-gray-700">Peso</label>
                    <input type="text" name="peso" id="peso" value={formData.peso || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="medidas" className="block text-sm font-medium text-gray-700">Medidas</label>
                    <input type="text" name="medidas" id="medidas" value={formData.medidas || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                  </div>
                  <div className="sm:col-span-2">
                     <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Padre</label>
                     <select name="parentId" id="parentId" value={formData.parentId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" disabled={!item}>
                        <option value="">-- Sin Padre (Producto Principal) --</option>
                        {possibleParents.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                     </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button type="button" className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto" onClick={handleSave}>
                  Guardar
                </button>
                <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>
                  Cancelar
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SinopticoItemModal;
