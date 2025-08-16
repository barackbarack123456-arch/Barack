import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, PencilIcon, PlusCircleIcon } from '@heroicons/react/24/solid';

const SinopticoNode = ({ node, level, editMode, onEdit }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  const toggleOpen = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  const indentation = { paddingLeft: `${level * 2}rem` };

  const typeColor = {
    producto: 'bg-blue-100 text-blue-800',
    subproducto: 'bg-green-100 text-green-800',
    insumo: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div>
      <div className="grid grid-cols-7 gap-4 px-4 py-3 items-center border-b border-gray-100 hover:bg-gray-50">
        <div className="col-span-2 flex items-center" style={indentation}>
          {hasChildren ? (
            <button onClick={toggleOpen} className="mr-2 text-gray-500">
              {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-6 mr-2"></span> // Placeholder for alignment
          )}
          <span className="font-medium text-gray-800">{node.nombre || 'N/A'}</span>
        </div>
        <div className="text-gray-600">{node.codigo || 'N/A'}</div>
        <div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColor[node.type] || 'bg-gray-100 text-gray-800'}`}>
            {node.type || 'N/A'}
          </span>
        </div>
        <div className="text-gray-600">{node.peso || 'N/A'}</div>
        <div className="text-gray-600">{node.medidas || 'N/A'}</div>
        {editMode && (
          <div className="flex items-center space-x-2">
            <button onClick={() => onEdit(node)} className="text-blue-600 hover:text-blue-800" title="Editar Item">
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
      {isOpen && hasChildren && (
        <div className="bg-white">
          {node.children.map(childNode => (
            <SinopticoNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              editMode={editMode}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SinopticoNode;
