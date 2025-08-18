import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';

const ProfileModal = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth();
  const showNotification = useNotification();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('Las contraseñas nuevas no coinciden', 'error');
      return;
    }
    if (newPassword.length < 6) {
        showNotification('La contraseña nueva debe tener al menos 6 caracteres', 'error');
        return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      showNotification('Contraseña actualizada correctamente', 'success');
      onClose();
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="current-password">
              Contraseña actual
            </label>
            <input
              type="password"
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
              Nueva contraseña
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-gray-200 text-blue-700 font-semibold py-2 px-4 border border-blue-500 rounded"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
