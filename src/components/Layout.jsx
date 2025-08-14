import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, ChevronDown, Users, Building } from 'lucide-react';

function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200 w-full flex-shrink-0 z-40 sticky top-0">
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center flex-shrink-0">
                <div className="h-10 w-10 bg-slate-800 rounded-full" />
              </Link>
              <NavLink to="/" className={navLinkClasses} end>Dashboard</NavLink>

              {/* Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <span>Bases de Datos</span>
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-30 p-1">
                    <NavLink to="/clientes" className={navLinkClasses}><Users size={16} />Clientes</NavLink>
                    {/* Add other links like Proveedores here */}
                  </div>
                )}
              </div>

              <NavLink to="/sinoptico" className={navLinkClasses}>Sinóptico</NavLink>
              {/* <NavLink to="/flowchart" className={navLinkClasses}>Flujogramas</NavLink> */}
            </div>

            {currentUser && (
              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-700">{currentUser.displayName || currentUser.email}</span>
                 <button onClick={handleLogout} title="Cerrar Sesión" className="p-2 rounded-full hover:bg-red-100 text-red-600">
                   <LogOut size={18} />
                 </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
