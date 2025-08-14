import React, { useState, useEffect } from 'react';

// The actual Toast component that renders the UI for a single toast.
function Toast({ message, type, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const typeClasses = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  };

  return (
    <div
      className={`flex items-center px-5 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 ease-in-out transform ${typeClasses[type] || 'bg-slate-700'} ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20">&times;</button>
    </div>
  );
};

export default Toast;
