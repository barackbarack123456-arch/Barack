import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { deleteDocument } from '../services/dataService';
import { Plus, Edit, Trash2 } from 'lucide-react';

function DataTable({ collectionName, schema }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Memoize columns to avoid re-calculating on every render
  const columns = useMemo(() => {
    return Object.keys(schema).filter(key => key !== 'formattingRules');
  }, [schema]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), firestoreOrderBy('id'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setData(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collection:", error);
      addToast(`Error al cargar datos de ${collectionName}`, 'error');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collectionName, addToast]);

  const handleDelete = async (docId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      try {
        await deleteDocument(collectionName, docId, currentUser);
        addToast('Registro eliminado con éxito', 'success');
      } catch (error) {
        console.error('Error deleting document:', error);
        addToast('No se pudo eliminar el registro', 'error');
      }
    }
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-700 capitalize">{collectionName}</h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />
          <span>Nuevo Registro</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50">
            <tr>
              {columns.map(key => (
                <th key={key} scope="col" className="px-6 py-3">{schema[key].label}</th>
              ))}
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.docId} className="bg-white border-b hover:bg-slate-50">
                {columns.map(key => (
                  <td key={key} className="px-6 py-4">
                    {/* Basic data rendering, will be improved with formatting */}
                    {item[key]?.toString() || ''}
                  </td>
                ))}
                <td className="px-6 py-4 flex items-center gap-4">
                  <button className="text-slate-500 hover:text-blue-600"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item.docId)} className="text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
