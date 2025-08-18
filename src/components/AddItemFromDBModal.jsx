import React, { useState, useEffect, useMemo } from 'react';
import { getInsumos } from '../services/modules/insumosService';
import { getSubproductos } from '../services/modules/subproductosService';
import { XMarkIcon } from '@heroicons/react/24/solid';

const AddItemFromDBModal = ({ isOpen, onClose, onAddItems, parentId, rootProductId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
          const [insumos, subproductos] = await Promise.all([
            getInsumos(),
            getSubproductos()
          ]);
          const combined = [
            ...insumos.map(i => ({ ...i, type: 'insumo' })),
            ...subproductos.map(s => ({ ...s, type: 'subproducto' })),
          ];
          setItems(combined);
        } catch (err) {
          setError('No se pudieron cargar los items.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchItems();
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleToggleSelection = (itemId) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const handleAddClick = () => {
    onAddItems(Array.from(selectedItems));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Añadir Items desde la Base de Datos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto flex-grow p-4">
          {loading && <p>Cargando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <ul className="divide-y divide-gray-200">
              {filteredItems.map(item => (
                <li
                  key={item.id}
                  className={`flex items-center justify-between p-3 cursor-pointer ${selectedItems.has(item.id) ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                  onClick={() => handleToggleSelection(item.id)}
                >
                  <div>
                    <p className="font-semibold">{item.nombre}</p>
                    <p className="text-sm text-gray-500">{item.codigo} - <span className="capitalize">{item.type}</span></p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    readOnly
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300">
            Cancelar
          </button>
          <button
            onClick={handleAddClick}
            disabled={selectedItems.size === 0}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
          >
            Añadir {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemFromDBModal;
