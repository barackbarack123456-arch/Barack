import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Welcome back, {currentUser?.displayName || 'User'}!
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/clientes">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-bold text-slate-800">Clientes</h2>
            <p className="mt-2 text-slate-600">
              View and manage your clients.
            </p>
          </div>
        </Link>

        <Link to="/sinoptico">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-xl font-bold text-slate-800">Sinóptico</h2>
            <p className="mt-2 text-slate-600">
              Access the synoptic view.
            </p>
          </div>
        </Link>

        {/* You can add more cards here as you create more pages */}
      </div>
    </div>
  );
}

export default DashboardPage;
