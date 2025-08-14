import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from '../components/Toast'; // Import the new component

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = idCounter++;
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]); // Added missing dependency

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

export default ToastProvider; // Use default export to solve Fast Refresh issue
