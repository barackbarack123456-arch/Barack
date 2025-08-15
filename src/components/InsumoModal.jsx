import React, { useState, useEffect, Fragment, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const InsumoModal = forwardRef(({ open, onClose, onSave, insumo }, ref) => {
  const [formData, setFormData] = useState({
    id: '',
    descripcion: '',
    material: '',
    costo: 0,
    unidadMedidaId: '',
  });

  useEffect(() => {
    if (insumo) {
      setFormData({
        id: insumo.id || '',
        descripcion: insumo.descripcion || '',
        material: insumo.material || '',
        costo: insumo.costo || 0,
        unidadMedidaId: insumo.unidadMedidaId || '',
      });
    } else {
      setFormData({
        id: '',
        descripcion: '',
        material: '',
        costo: 0,
        unidadMedidaId: '',
      });
    }
  }, [insumo, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.descripcion || !formData.material) {
      alert('Descripción y Material son obligatorios.');
      return;
    }
    onSave(formData);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel ref={ref} className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {insumo ? 'Editar Insumo' : 'Añadir Nuevo Insumo'}
                  </Dialog.Title>
                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <input
                        type="text"
                        name="descripcion"
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="material" className="block text-sm font-medium text-gray-700">
                        Material
                      </label>
                      <input
                        type="text"
                        name="material"
                        id="material"
                        value={formData.material}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="costo" className="block text-sm font-medium text-gray-700">
                        Costo
                      </label>
                      <input
                        type="number"
                        name="costo"
                        id="costo"
                        value={formData.costo}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="unidadMedidaId" className="block text-sm font-medium text-gray-700">
                        Unidad de Medida
                      </label>
                      <input
                        type="text"
                        name="unidadMedidaId"
                        id="unidadMedidaId"
                        value={formData.unidadMedidaId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
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
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

export default InsumoModal;
