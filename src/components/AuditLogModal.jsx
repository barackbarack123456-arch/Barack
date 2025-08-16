import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { getAuditLogsForItem } from '../services/modules/sinopticoItemsService';
import GridSkeletonLoader from './GridSkeletonLoader';

const AuditLogModal = ({ isOpen, onClose, itemId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && itemId) {
      const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedLogs = await getAuditLogsForItem(itemId);
          setLogs(fetchedLogs);
        } catch (err) {
          setError('Error al cargar el historial de cambios.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen, itemId]);

  const renderChangeDetails = (log) => {
    if (log.action === 'create' && log.createdData) {
      return <pre className="text-xs bg-gray-100 p-2 rounded mt-1">{JSON.stringify(log.createdData, null, 2)}</pre>;
    }
    if (log.action === 'update' && log.changes) {
       return (
        <ul className="text-xs list-disc pl-5 mt-1">
          {Object.entries(log.changes).map(([key, value]) => (
            <li key={key}>
              <strong className="font-semibold">{key}:</strong> de <em className="text-red-600">{JSON.stringify(value.from)}</em> a <em className="text-green-600">{JSON.stringify(value.to)}</em>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-xs text-gray-500">No hay detalles adicionales.</p>;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
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

        <div className="fixed inset-0 z-20 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Historial de Cambios
                  </Dialog.Title>
                  <div className="mt-4" style={{ minHeight: '300px' }}>
                    {loading && <GridSkeletonLoader count={3} />}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && logs.length === 0 && (
                      <p>No se encontraron registros de auditoría para este item.</p>
                    )}
                    {!loading && !error && logs.length > 0 && (
                      <div className="space-y-4">
                        {logs.map(log => (
                          <div key={log.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-sm font-medium text-gray-800">
                              <span className="font-bold capitalize">{log.action}</span> por <span className="text-blue-600">{log.userEmail}</span>
                            </p>
                            <p className="text-xs text-gray-500 mb-1">
                              {log.timestamp?.toDate().toLocaleString() || 'Fecha no disponible'}
                            </p>
                            {renderChangeDetails(log)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AuditLogModal;
