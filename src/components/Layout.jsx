import React, { useState, Fragment, useMemo } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';
import {
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  TruckIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CubeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Transition } from '@headlessui/react';

const navItems = [
  { text: 'Dashboard', path: '/', icon: HomeIcon },
  { text: 'Proyectos', path: '/proyectos', icon: BriefcaseIcon },
  { text: 'Proveedores', path: '/proveedores', icon: TruckIcon },
  { text: 'Clientes', path: '/clientes', icon: UsersIcon },
  { text: 'Productos', path: '/productos', icon: ShoppingCartIcon },
  { text: 'Subproductos', path: '/subproductos', icon: CubeIcon },
  { text: 'Insumos', path: '/insumos', icon: ArchiveBoxIcon },
  { text: 'Sinóptico', path: '/sinoptico', icon: ChartBarIcon },
  { text: 'Usuarios', path: '/usuarios', icon: UserGroupIcon, adminOnly: true },
];

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const visibleNavItems = useMemo(() => {
    if (currentUser?.role === 'administrador') {
      return navItems;
    }
    return navItems.filter(item => !item.adminOnly);
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-surface shadow-lg">
        <div className="flex items-center justify-center h-20 border-b">
          <img src={logo} alt="Invictus Logo" className="h-10 w-auto" />
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-4 py-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.text}
                to={item.path}
                className={`flex items-center px-4 py-3 my-1 text-secondary rounded-lg transition-all duration-200 ease-in-out transform hover:bg-background hover:text-primary hover:scale-105 group ${
                  location.pathname === item.path ? 'bg-primary text-white shadow-inner' : 'hover:bg-background'
                }`}
              >
                <item.icon className="h-6 w-6 mr-3 transition-transform duration-200 ease-in-out group-hover:rotate-6" />
                <span className="font-medium">{item.text}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <header className="flex justify-between items-center h-20 bg-surface border-b px-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 w-full md:w-64 border rounded-md text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <div className="flex items-center relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-background transition-colors duration-200 focus:outline-none"
            >
              <UserCircleIcon className="h-9 w-9 text-secondary" />
              <span className="text-secondary text-sm font-medium hidden md:block">{currentUser?.email}</span>
              <ChevronDownIcon className={`h-5 w-5 text-secondary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
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
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none top-full z-10">
                <div className="py-1">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm text-secondary">Sesión iniciada como</p>
                    <p className="font-medium text-primary truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-3 text-sm text-secondary hover:bg-background hover:text-red-600 transition-colors duration-200"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
