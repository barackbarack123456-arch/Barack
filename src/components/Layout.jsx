import React, { useState, Fragment } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const navItems = [
  { text: 'Dashboard', path: '/', icon: HomeIcon },
  { text: 'Proveedores', path: '/proveedores', icon: UsersIcon },
  { text: 'Clientes', path: '/clientes', icon: UsersIcon },
  { text: 'Productos', path: '/productos', icon: ShoppingCartIcon },
  { text: 'Insumos', path: '/insumos', icon: ArchiveBoxIcon },
  { text: 'Sinóptico', path: '/sinoptico', icon: ChartBarIcon },
];

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            duration: 3000,
          },
          error: {
            duration: 5000,
          },
          style: {
            fontSize: '16px',
            padding: '16px',
          },
        }}
      />
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gray-800">
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <span className="text-white font-bold uppercase">Barack Ingenieria</span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 bg-gray-800">
            {navItems.map((item) => (
              <Link
                key={item.text}
                to={item.path}
                className={`flex items-center px-4 py-2 mt-2 text-gray-100 hover:bg-gray-700 rounded ${
                  location.pathname === item.path ? 'bg-gray-700' : ''
                }`}
              >
                <item.icon className="h-6 w-6 mr-2" />
                {item.text}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <header className="flex justify-between items-center h-16 bg-white border-b-2">
          <div className="flex items-center px-4">
            {/* Can add a mobile menu button here if needed */}
          </div>
          <div className="flex items-center pr-4 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-600" />
              <span className="text-gray-700 text-sm font-medium hidden md:block">{currentUser?.email}</span>
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            </button>
            <Transition
              as={Fragment}
              show={dropdownOpen}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none top-full">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">Signed in as</p>
                    <p className="truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
