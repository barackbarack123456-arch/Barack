import React from 'react';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard Principal</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700">¡Bienvenido!</h2>
        <p className="text-gray-600 mt-2">
          Has iniciado sesión como <span className="font-medium text-indigo-600">{currentUser?.email}</span>.
        </p>
        <p className="text-gray-600 mt-1">
          Utiliza la barra de navegación de la izquierda para moverte por la aplicación.
        </p>
      </div>

      {/* Future content can be added here, for example, summary cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Example card */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Proveedores Activos</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Clientes Registrados</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">87</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Productos en Stock</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">452</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Órdenes Recientes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">3</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
