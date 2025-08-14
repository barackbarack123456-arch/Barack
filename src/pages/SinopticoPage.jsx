import React, { useState } from 'react';
import SearchModal from '../components/SearchModal';
import { PackageSearch } from 'lucide-react';

function SinopticoPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Sinóptico de Producto</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PackageSearch size={18} />
          <span>Seleccionar Producto</span>
        </button>
      </div>

      {selectedProduct ? (
        <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in-up">
          <h2 className="text-2xl font-semibold">{selectedProduct.descripcion}</h2>
          <p className="text-sm text-slate-500 font-mono">{selectedProduct.id}</p>
          {/* Tree view of components will be rendered here */}
          <div className="mt-6">
            <p className="text-slate-600">El árbol de componentes se mostrará aquí.</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-700">No hay ningún producto seleccionado</h2>
          <p className="text-slate-500 mt-2">Por favor, selecciona un producto para ver su sinóptico.</p>
        </div>
      )}

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleProductSelect}
        collectionName="productos"
        title="Buscar Producto"
      />
    </div>
  );
}

export default SinopticoPage;
