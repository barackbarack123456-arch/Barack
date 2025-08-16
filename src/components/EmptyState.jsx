import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const EmptyState = ({
  icon: Icon = PlusIcon,
  title = "Sin resultados",
  message = "Parece que no hay nada por aquí todavía.",
  actionText,
  onAction,
}) => {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full p-12 bg-gray-50 rounded-lg">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
