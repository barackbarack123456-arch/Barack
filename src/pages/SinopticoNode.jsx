import React, { useState, useEffect, memo } from 'react';
import { ChevronRightIcon, ChevronDownIcon, PencilIcon, PlusCircleIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useQuickUpdate } from '../hooks/useQuickUpdate';

const SinopticoNode = ({ node, level, isLastChild, editMode, onEdit, onQuickUpdate, onOpenAuditLog }) => {
  const [editingField, setEditingField] = useState(null); // 'nombre', 'codigo', or null
  const [editValue, setEditValue] = useState('');
  const { updateField, loading: isUpdating } = useQuickUpdate();

  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    if (!editMode) {
      setEditingField(null);
    }
  }, [editMode]);

  const handleDoubleClick = (field, currentValue) => {
    if (editMode) {
      setEditingField(field);
      setEditValue(currentValue);
    }
  };

  const handleUpdate = async () => {
    if (isUpdating) return;

    const originalValue = node[editingField];
    if (editValue.trim() === originalValue || editValue.trim() === '') {
      setEditingField(null);
      return;
    }

    const success = await updateField(node.id, editingField, editValue.trim());
    if (success) {
      onQuickUpdate(node.id, editingField, editValue.trim());
    }
    setEditingField(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditingField(null);
      setEditValue('');
    }
  };

  const renderEditableCell = (field, value) => {
    if (editingField === field) {
      return (
        <div className="relative w-full">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={handleKeyDown}
            className="w-full px-1 py-0.5 border border-blue-400 rounded-md pr-6"
            autoFocus
            disabled={isUpdating}
          />
          {isUpdating && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              <ArrowPathIcon className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      );
    }
    return (
      <div onDoubleClick={() => handleDoubleClick(field, value)} className="w-full h-full cursor-pointer">
        {value || 'N/A'}
      </div>
    );
  };


  const indentation = { paddingLeft: `${level * 1.5 + 1.5}rem` };

  const typeColor = {
    producto: 'bg-blue-100 text-blue-800',
    subproducto: 'bg-green-100 text-green-800',
    insumo: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="relative">
      <div className={`grid grid-cols-9 gap-4 px-4 py-3 items-center ${editMode ? 'hover:bg-gray-50' : ''}`}>
        <div className="col-span-3 flex items-center relative" style={indentation}>
          {hasChildren ? (
            <span className="w-6 mr-2 text-gray-500 z-10">
              <ChevronDownIcon className="h-4 w-4" />
            </span>
          ) : (
            <span className="w-6 mr-2"></span> // Placeholder for alignment
          )}
          <div className="font-medium text-gray-800 w-full">{renderEditableCell('nombre', node.nombre || node.descripcion)}</div>
        </div>
        <div className="text-gray-600 w-full">{renderEditableCell('codigo', node.codigo)}</div>
        <div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColor[node.type] || 'bg-gray-100 text-gray-800'}`}>
            {node.type || 'N/A'}
          </span>
        </div>
        <div className="text-gray-600">{node.version || 'N/A'}</div>
        <div className="text-gray-600">{node.codigo_cliente || 'N/A'}</div>
        <div className="text-gray-600">{node.peso || 'N/A'}</div>
        <div className="text-gray-600">{node.medidas || 'N/A'}</div>
        {editMode && (
          <div className="col-span-1 flex items-center space-x-2">
            <button onClick={() => onOpenAuditLog(node.id)} className="text-gray-600 hover:text-gray-800" title="Ver Historial">
              <ClockIcon className="h-5 w-5" />
            </button>
            <button onClick={() => onEdit(node)} className="text-blue-600 hover:text-blue-800" title="Editar Item Completo">
              <PencilIcon className="h-5 w-5" />
            </button>
            {node.type !== 'insumo' && (
              <button
                onClick={() => onEdit(null, { parentId: node.id, rootProductId: node.rootProductId || node.id, type: 'subproducto' })}
                className="text-green-600 hover:text-green-800"
                title="Añadir Item Hijo"
              >
                <PlusCircleIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(SinopticoNode);
