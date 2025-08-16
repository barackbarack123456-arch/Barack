import React, { useState, useEffect, Fragment, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getProyectos } from '../services/modules/proyectosService';
import { UNITS } from '../constants/units';

const ProductoModal = forwardRef(({ open, onClose, onSave, producto }, ref) => {
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    unidad_medida: '',
    proyecto: '',
  });
  const [proyectos, setProyectos] = useState([]);

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const data = await getProyectos();
        setProyectos(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProyectos();
  }, []);

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo: producto.codigo || '',
        descripcion: producto.descripcion || '',
        unidad_medida: producto.unidad_medida || '',
        proyecto: producto.proyecto || '',
      });
    } else {
      setFormData({
        codigo: '',
        descripcion: '',
        unidad_medida: '',
        proyecto: '',
      });
    }
  }, [producto, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.codigo || !formData.descripcion || !formData.unidad_medida || !formData.proyecto) {
      alert('Todos los campos son obligatorios.');
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
                    {producto ? 'Editar Producto' : 'Añadir Nuevo Producto'}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Por favor, complete los detalles del producto.
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
                          value={formData.codigo}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <textarea
                          name="descripcion"
                          id="descripcion"
                          rows={3}
                          value={formData.descripcion}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="unidad_medida" className="block text-sm font-medium text-gray-700">
                          Unidad de Medida
                        </label>
                        <select
                          id="unidad_medida"
                          name="unidad_medida"
                          value={formData.unidad_medida}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Seleccione una unidad</option>
                          {UNITS.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.nombre} ({unit.abreviatura})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="proyecto" className="block text-sm font-medium text-gray-700">
                          Proyecto
                        </label>
                        <select
                          id="proyecto"
                          name="proyecto"
                          value={formData.proyecto}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Seleccione un proyecto</option>
                          {proyectos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
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
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

export default ProductoModal;
