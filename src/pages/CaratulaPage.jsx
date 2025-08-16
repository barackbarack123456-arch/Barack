import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTopLevelProducts } from '../services/sinopticoService';
import EmptyState from '../components/EmptyState';

const CaratulaPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const topLevelProducts = await getTopLevelProducts();
        setProducts(topLevelProducts);
        setError(null);
      } catch (err) {
        setError('Error al cargar los productos. Por favor, inténtelo de nuevo más tarde.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSelectProduct = (e) => {
    setSelectedProduct(e.target.value);
  };

  const handleViewSinoptico = () => {
    if (selectedProduct) {
      navigate(`/sinoptico/${selectedProduct}`);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 border-b pb-4">Módulo Sinóptico</h1>
        <p className="text-gray-600 mb-8">
          Seleccione un producto principal para visualizar su estructura jerárquica de subproductos e insumos.
        </p>

        {loading && <p className="text-blue-500">Cargando productos...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          products.length > 0 ? (
            <div className="flex items-center space-x-4">
              <select
                value={selectedProduct}
                onChange={handleSelectProduct}
                className="block w-full px-4 py-2 text-base text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>-- Seleccione un producto --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={handleViewSinoptico}
                disabled={!selectedProduct}
                className="px-6 py-2 text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Ver Sinóptico
              </button>
            </div>
          ) : (
            <EmptyState
              title="No hay productos principales"
              message="Aún no se han creado productos principales. Puede crear uno desde el módulo de productos."
            />
          )
        )}
      </div>
    </div>
  );
};

export default CaratulaPage;
