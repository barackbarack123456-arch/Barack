import React from 'react';
import { InformationCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ActionsCellRenderer = ({ data, onInfo, onEdit, onDelete }) => (
  <div className="flex items-center justify-center space-x-2">
    <button data-testid="info-button" onClick={() => onInfo(data)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
      <InformationCircleIcon className="h-5 w-5" />
    </button>
    <button data-testid="edit-button" onClick={() => onEdit(data)} className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
      <PencilIcon className="h-5 w-5" />
    </button>
    <button data-testid="delete-button" onClick={() => onDelete(data.id)} className="text-red-600 hover:text-red-900 transition-colors duration-200">
      <TrashIcon className="h-5 w-5" />
    </button>
  </div>
);

export default ActionsCellRenderer;
