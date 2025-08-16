import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHierarchyForProduct, createNewChildItem } from '../services/sinopticoService';
import { updateSinopticoItem, getSinopticoItems } from '../services/modules/sinopticoItemsService';
import EmptyState from '../components/EmptyState';
import GridSkeletonLoader from '../components/GridSkeletonLoader';
import SinopticoNode from './SinopticoNode';
import SinopticoItemModal from '../components/SinopticoItemModal';

const SinopticoPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [rootProduct, setRootProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalInitialState, setModalInitialState] = useState({});


  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      const [tree, allItemsData] = await Promise.all([
        getHierarchyForProduct(productId),
        getSinopticoItems() // For the parent dropdown
      ]);

      setHierarchy(tree);
      setAllItems(allItemsData);

      if (tree && tree.length > 0) {
        setRootProduct(tree[0]);
      } else {
        // If there's no hierarchy, maybe the product exists as a top-level item
        const rootItem = allItemsData.find(item => item.id === productId);
        setRootProduct(rootItem);
      }
      setError(null);
    } catch (err) {
      setError('Error al cargar la jerarquía del producto. Por favor, inténtelo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      navigate('/sinoptico');
      return;
    }
    fetchHierarchy();
  }, [productId, navigate, fetchHierarchy]);

  const handleOpenModal = (item = null, initialState = {}) => {
    setEditingItem(item);
    setModalInitialState(initialState);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setModalInitialState({});
  };

  const handleSave = async (formData, itemId) => {
    try {
      if (itemId) { // Editing existing item
        await updateSinopticoItem(itemId, formData);
      } else { // Adding new item
        await createNewChildItem(formData, formData.parentId, formData.rootProductId, formData.type, 'currentUserId'); // Replace with actual user ID
      }
      fetchHierarchy(); // Refetch data
    } catch (error) {
      console.error("Error saving item", error);
      setError("Error al guardar el item.");
    }
  };

  const renderHeader = () => (
    <div className="grid grid-cols-7 gap-4 px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-t-lg">
      <div className="col-span-2">Nombre</div>
      <div>Código</div>
      <div>Tipo</div>
      <div>Peso</div>
      <div>Medidas</div>
      {editMode && <div>Acciones</div>}
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/sinoptico')} className="text-blue-600 hover:underline">
            &larr; Volver a la selección
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 rounded-md text-white font-semibold ${editMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {editMode ? 'Salir del Modo Edición' : 'Editar Jerarquía'}
          </button>
        </div>

        {loading && <GridSkeletonLoader count={10} />}

        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          !hierarchy || hierarchy.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
               <h1 className="text-2xl font-bold text-gray-800 mb-2">{rootProduct?.nombre || 'Producto'}</h1>
              <EmptyState
                title="Sin Jerarquía"
                message="Este sinóptico aún no tiene una familia o jerarquía creada."
              />
              <button
                onClick={() => handleOpenModal(null, { parentId: rootProduct.id, rootProductId: rootProduct.id, type: 'subproducto'})}
                className="mt-4 px-6 py-2 text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
              >
                Añadir Primer Item
              </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">{rootProduct?.nombre}</h1>
                <p className="text-sm text-gray-500">
                  Creado por: <span className="font-semibold">{rootProduct?.createdBy || 'N/A'}</span> el {rootProduct?.createdAt ? new Date(rootProduct.createdAt).toLocaleDateString() : 'N/A'}
                </p>
                 <p className="text-sm text-gray-500">
                  Revisado por: <span className="font-semibold">{rootProduct?.reviewedBy || 'N/A'}</span>
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {renderHeader()}
                <div className="divide-y divide-gray-200">
                  {hierarchy.map(node => (
                    <SinopticoNode
                      key={node.id}
                      node={node}
                      level={0}
                      editMode={editMode}
                      onEdit={handleOpenModal}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      <SinopticoItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        item={editingItem}
        allItems={allItems}
        {...modalInitialState}
      />
    </div>
  );
};

export default SinopticoPage;
