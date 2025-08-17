import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Transition } from '@headlessui/react';
import { UsersIcon, ShoppingCartIcon, ArchiveBoxIcon, TruckIcon } from '@heroicons/react/24/outline';
import { getProveedoresCount } from '../services/modules/proveedoresService';
import { getClientesCount } from '../services/modules/clientesService';
import { getSinopticoItemsCount as getProductosCount } from '../services/modules/sinopticoItemsService';
import { getInsumosCount } from '../services/modules/insumosService';

function DashboardPage() {
  const { currentUser } = useAuth();
  const [showCards, setShowCards] = useState(false);
  const [stats, setStats] = useState({
    proveedores: '...',
    clientes: '...',
    productos: '...',
    insumos: '...',
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [proveedoresCount, clientesCount, productosCount, insumosCount] = await Promise.all([
          getProveedoresCount(),
          getClientesCount(),
          getProductosCount(),
          getInsumosCount(),
        ]);
        setStats({
          proveedores: proveedoresCount,
          clientes: clientesCount,
          productos: productosCount,
          insumos: insumosCount,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats({
          proveedores: 'N/A',
          clientes: 'N/A',
          productos: 'N/A',
          insumos: 'N/A',
        });
      }
    };

    fetchStats();
    const timer = setTimeout(() => setShowCards(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const summaryCards = [
    { title: "Proveedores Activos", value: stats.proveedores, icon: TruckIcon, color: "bg-primary" },
    { title: "Clientes Registrados", value: stats.clientes, icon: UsersIcon, color: "bg-accent" },
    { title: "Productos en Stock", value: stats.productos, icon: ShoppingCartIcon, color: "bg-secondary" },
    { title: "Insumos Disponibles", value: stats.insumos, icon: ArchiveBoxIcon, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg shadow-lg bg-gradient-to-r from-primary to-accent text-white">
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
            <div className="bg-surface p-6 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center space-x-4">
              <div className={`p-3 rounded-full text-white ${card.color}`}>
                <card.icon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary">{card.title}</h3>
                <p className="text-3xl font-bold text-primary mt-1">{card.value}</p>
              </div>
            </div>
          </Transition>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
