import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import Modal from './Modal';

function SearchModal({ isOpen, onClose, onSelect, collectionName, title }) {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchItems = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const fetchedItems = querySnapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
          setItems(fetchedItems);
        } catch (error) {
          console.error("Error fetching items for search modal:", error);
          // In a real app, you might use a toast to show this error
        } finally {
          setLoading(false);
        }
      };
      fetchItems();
    }
  }, [isOpen, collectionName]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return items;
    }
    return items.filter(item =>
      (item.descripcion || item.name || item.id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleSelect = (item) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <input
          type="text"
          placeholder="Buscar por descripción..."
          className="w-full px-4 py-2 border rounded-lg mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {filteredItems.map(item => (
              <li
                key={item.docId}
                onClick={() => handleSelect(item)}
                className="p-3 rounded-md hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
              >
                <p className="font-semibold text-slate-800">{item.descripcion || item.name || item.id}</p>
              </li>
            ))}
            {filteredItems.length === 0 && <p className="text-center text-slate-500 py-4">No se encontraron resultados.</p>}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export default SearchModal;
