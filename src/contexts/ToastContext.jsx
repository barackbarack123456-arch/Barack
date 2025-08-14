import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = idCounter++;
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-8 right-8 space-y-3 z-[1100]">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// The actual Toast component that renders the UI for a single toast.
// Placing it here for simplicity as it's tightly coupled to the provider.
const Toast = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setShow(true);

    // The parent provider will handle the removal timeout.
    // This effect is just for the entrance animation.
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
