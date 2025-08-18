import React, { useState, useEffect, Fragment, forwardRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { UNITS } from '../constants/units';
import { useNotification } from '../hooks/useNotification';

const InsumoModal = forwardRef(({ open, onClose, onSave, insumo }, ref) => {
  const { addNotification } = useNotification();
  const getInitialFormData = () => ({
    codigo: '',
    descripcion: '',
    unidad_medida: '',
    material: '',
    codigo_proveedor: '',
    imagen: '',
    piezas_por_vehiculo: '',
    proceso: '',
    aspecto_lc_kd: '',
    color: '',
    materia_prima: '',
    proveedor_materia_prima: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (insumo) {
      setFormData({
        codigo: insumo.codigo || '',
        descripcion: insumo.descripcion || '',
        unidad_medida: insumo.unidad_medida || '',
        material: insumo.material || '',
        codigo_proveedor: insumo.codigo_proveedor || '',
        imagen: insumo.imagen || '',
        piezas_por_vehiculo: insumo.piezas_por_vehiculo || '',
        proceso: insumo.proceso || '',
        aspecto_lc_kd: insumo.aspecto_lc_kd || '',
        color: insumo.color || '',
        materia_prima: insumo.materia_prima || '',
        proveedor_materia_prima: insumo.proveedor_materia_prima || '',
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [insumo, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.codigo || !formData.descripcion) {
      addNotification({
        message: 'Código y Descripción son obligatorios.',
        type: 'error',
      });
      return;
    }
    onSave(formData);
  };

  const renderInput = (name, label, type = 'text') => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 capitalize">
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={formData[name]}
        onChange={handleChange}
        className="form-input mt-1"
      />
    </div>
  );

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
              <Dialog.Panel ref={ref} className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                    {insumo ? 'Editar Insumo' : 'Añadir Nuevo Insumo'}
                  </Dialog.Title>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-4 sm:gap-x-6">
                    {renderInput("codigo", "Código")}
                    <div className="sm:col-span-3">
                      {renderInput("descripcion", "Descripción")}
                    </div>
                    <div>
                      <label htmlFor="unidad_medida" className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                      <select
                        id="unidad_medida"
                        name="unidad_medida"
                        value={formData.unidad_medida}
                        onChange={handleChange}
                        className="form-input mt-1"
                      >
                        <option value="">Seleccione una unidad</option>
                        {UNITS.map(unit => (
                          <option key={unit.id} value={unit.id}>{unit.nombre} ({unit.abreviatura})</option>
                        ))}
                      </select>
                    </div>
                    {renderInput("codigo_proveedor", "Código Proveedor")}
                    {renderInput("imagen", "Imagen (URL)")}
                    {renderInput("piezas_por_vehiculo", "Piezas/Vh", "number")}
                    {renderInput("proceso", "Proceso")}
                    <div>
                      <label htmlFor="aspecto_lc_kd" className="block text-sm font-medium text-gray-700">LC/KD</label>
                      <select
                        id="aspecto_lc_kd"
                        name="aspecto_lc_kd"
                        value={formData.aspecto_lc_kd}
                        onChange={handleChange}
                        className="form-input mt-1"
                      >
                        <option value="">Seleccione una opción</option>
                        <option value="LC">LC</option>
                        <option value="KD">KD</option>
                      </select>
                    </div>
                    {renderInput("color", "Color")}
                    {renderInput("material", "Material")}
                    {renderInput("materia_prima", "Materia Prima")}
                    {renderInput("proveedor_materia_prima", "Proveedor")}
                  </div>
                </div>
                <div className="bg-gray-100 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
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
