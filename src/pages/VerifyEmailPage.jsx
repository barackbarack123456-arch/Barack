import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendVerificationEmail();
      setMessage('Se ha enviado un nuevo enlace de verificación a tu correo.');
    } catch (err) {
      setError('Error al enviar el correo de verificación. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Verifica tu Correo
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gracias por registrarte. Antes de continuar, por favor verifica tu correo electrónico.
          </p>
          <p className="mt-4 font-medium text-gray-800">
            Hemos enviado un enlace de verificación a: <br/><strong>{currentUser?.email}</strong>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {message && <p className="text-green-600 bg-green-50 p-3 rounded-md text-sm text-center">{message}</p>}
          {error && <p className="text-red-600 bg-red-50 p-3 rounded-md text-sm text-center">{error}</p>}

          <div>
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Enviando...' : 'Reenviar Correo de Verificación'}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              onClick={handleLogout}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Cerrar Sesión e Iniciar con otra cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
