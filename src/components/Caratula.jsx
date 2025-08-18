import React from 'react';
import logo from '../assets/logo.png'; // Import the logo

// Custom component for each data cell in the grid
const InfoCell = ({ label, value, className = '' }) => (
  <div className={`border-t border-r border-gray-300 p-2 ${className}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-sm text-gray-800">{value}</p>
  </div>
);

const Caratula = ({ rootProduct }) => {
  // Static data for demonstration
  const realizadoPor = "Nombre del Realizador";
  const fechaRealizacion = new Date().toLocaleDateString();
  const revisadoPor = "Nombre del Revisor";

  return (
    <div className="bg-surface shadow-lg border border-gray-200 w-full max-w-5xl mx-auto my-8">
      <div className="grid grid-cols-12">
        {/* Logo Section */}
        <div className="col-span-4 flex items-center justify-center p-4 border-r border-gray-300">
          <img src={logo} alt="Company Logo" className="max-h-24" />
        </div>

        {/* Project Title Section */}
        <div className="col-span-8 flex items-center justify-center p-4 bg-primary text-white">
          <h1 className="text-2xl font-bold text-center">
            {rootProduct ? rootProduct.nombre : "Nombre del Proyecto"}
          </h1>
        </div>

        {/* Data Grid */}
        <div className="col-span-12 grid grid-cols-4 border-t border-gray-300">
          <InfoCell label="Realizado por" value={realizadoPor} />
          <InfoCell label="Fecha de realización" value={fechaRealizacion} />
          <InfoCell label="Revisado por" value={revisadoPor} />
          <InfoCell label="Última Modificación" value={new Date().toLocaleDateString()} />
        </div>

        {/* Dynamic Project Data */}
        {rootProduct && (
          <div className="col-span-12 grid grid-cols-4">
            <InfoCell label="Código" value={rootProduct.codigo} />
            <InfoCell label="Descripción" value={rootProduct.descripcion} />
            <InfoCell label="Cliente" value={rootProduct.cliente} />
            <InfoCell label="Estado" value={rootProduct.estado} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Caratula;
