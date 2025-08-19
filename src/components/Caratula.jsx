import React from 'react';
import logo from '../assets/logo.png'; // Import the logo

// Custom component for each data cell in the grid
const InfoCell = ({ label, value, className = '' }) => (
  <div className={`border-t border-r border-gray-300 p-2 ${className}`}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-sm text-gray-800">{value}</p>
  </div>
);

const Caratula = ({ rootProduct, projectData }) => {
  const getDisplayValue = (value) => value || 'N/A';

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    // Assuming timestamp is a Firebase Timestamp object
    return timestamp.toDate ? timestamp.toDate().toLocaleDateString() : new Date(timestamp).toLocaleDateString();
  };

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
            {getDisplayValue(projectData?.nombre)}
          </h1>
        </div>

        {/* Data Grid */}
        <div className="col-span-12 grid grid-cols-4 border-t border-gray-300">
          <InfoCell label="Realizado por" value={getDisplayValue(rootProduct?.createdBy)} />
          <InfoCell label="Fecha de realización" value={formatDate(rootProduct?.createdAt)} />
          <InfoCell label="Revisado por" value={getDisplayValue(projectData?.revisadoPor)} />
          <InfoCell label="Última Modificación" value={formatDate(rootProduct?.lastModifiedAt)} />
        </div>

        {/* Dynamic Project Data */}
        <div className="col-span-12 grid grid-cols-4">
          <InfoCell label="Código del Proyecto" value={getDisplayValue(projectData?.codigo)} />
          <InfoCell label="Cliente" value={getDisplayValue(projectData?.cliente)} />
          <InfoCell label="Código del Producto" value={getDisplayValue(rootProduct?.codigo)} />
          <InfoCell label="Versión del Producto" value={getDisplayValue(rootProduct?.version)} />
        </div>
      </div>
    </div>
  );
};

export default Caratula;
