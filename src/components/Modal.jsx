import React from 'react';
import { X } from 'lucide-react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-[1055]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        <div className="p-5 flex-grow overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
