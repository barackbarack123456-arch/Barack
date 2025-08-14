import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

function ForgotPasswordPage() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setMessage('Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.');
    } catch (err) {
      setError('Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Barack - Ingenieria
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Restablece tu contraseña
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">E-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading || message}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <p className="text-gray-600">
            ¿Recordaste tu contraseña?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
