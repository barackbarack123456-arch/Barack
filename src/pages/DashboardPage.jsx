import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Transition } from '@headlessui/react';
import { UsersIcon, ShoppingCartIcon, ArchiveBoxIcon, TruckIcon } from '@heroicons/react/24/outline';

const summaryCards = [
  { title: "Proveedores Activos", value: "12", icon: TruckIcon, color: "bg-blue-500" },
  { title: "Clientes Registrados", value: "87", icon: UsersIcon, color: "bg-green-500" },
  { title: "Productos en Stock", value: "452", icon: ShoppingCartIcon, color: "bg-yellow-500" },
  { title: "Insumos Disponibles", value: "73", icon: ArchiveBoxIcon, color: "bg-red-500" },
];

function DashboardPage() {
  const { currentUser } = useAuth();
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setShowCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <h1 className="text-3xl font-bold">¡Bienvenido de nuevo!</h1>
        <p className="mt-2 text-lg">
          Sesión iniciada como <span className="font-semibold">{currentUser?.email}</span>.
        </p>
        <p className="mt-1 text-indigo-200">
          Explora las secciones para gestionar la información de tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <Transition
            key={card.title}
            show={showCards}
            enter="transition-transform transition-opacity duration-500"
            enterFrom="opacity-0 scale-90"
            enterTo="opacity-100 scale-100"
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4">
              <div className={`p-3 rounded-full text-white ${card.color}`}>
                <card.icon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          </Transition>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
