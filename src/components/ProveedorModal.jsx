import React, { useState, useEffect } from 'react';
import { Dialog, Transition, TransitionChild } from '@headlessui/react';

function ProveedorModal({ open, onClose, onSave, proveedor }) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (proveedor) {
      setCodigo(proveedor.codigo || '');
      setDescripcion(proveedor.descripcion || '');
    } else {
      setCodigo('');
      setDescripcion('');
    }
  }, [proveedor, open]);

  const handleSave = () => {
    if (!codigo || !descripcion) {
      // A more modern way to show alerts could be implemented later
      alert('Código y Descripción son obligatorios.');
      return;
    }
    onSave({ codigo, descripcion });
  };

  return (
    <Transition show={open}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild>
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in data-closed:opacity-0" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild>
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg data-enter:ease-out data-enter:duration-300 data-leave:ease-in data-leave:duration-200 data-closed:opacity-0 data-closed:translate-y-4 data-closed:sm:translate-y-0 data-closed:sm:scale-95">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {proveedor ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Por favor, complete los detalles del proveedor.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">
                          Código
                        </label>
                        <input
                          type="text"
                          name="codigo"
                          id="codigo"
                          value={codigo}
                          onChange={(e) => setCodigo(e.target.value)}
                          readOnly={!!proveedor}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm read-only:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <input
                          type="text"
                          name="descripcion"
                          id="descripcion"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleSave}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                </div>
              </Dialog.Panel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default ProveedorModal;
