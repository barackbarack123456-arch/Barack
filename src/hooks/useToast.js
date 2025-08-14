import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext.js';

export const useToast = () => {
  return useContext(ToastContext);
};
