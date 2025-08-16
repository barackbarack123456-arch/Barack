import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHierarchyForProduct, createNewChildItem } from '../services/sinopticoService';
import { updateSinopticoItem, getSinopticoItems } from '../services/modules/sinopticoItemsService';
import { exportToCSV, exportToPDF } from '../utils/fileExporters';
import EmptyState from '../components/EmptyState';
import GridSkeletonLoader from '../components/GridSkeletonLoader';
import SinopticoNode from './SinopticoNode';
import SinopticoItemModal from '../components/SinopticoItemModal';
import AuditLogModal from '../components/AuditLogModal'; // Importar el nuevo modal

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
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [auditedItemId, setAuditedItemId] = useState(null);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      const [tree, allItemsData] = await Promise.all([
        getHierarchyForProduct(productId),
        getSinopticoItems()
      ]);

      setHierarchy(tree);
      setAllItems(allItemsData);

      const rootItem = allItemsData.find(item => item.id === productId);
      setRootProduct(rootItem);

      if (!tree || tree.length === 0) {
        setHierarchy(null);
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
      navigate('/productos');
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

  const handleOpenAuditLogModal = (itemId) => {
    setAuditedItemId(itemId);
    setIsAuditLogModalOpen(true);
  };

  const handleCloseAuditLogModal = () => {
    setIsAuditLogModalOpen(false);
    setAuditedItemId(null);
  };

  const handleSave = async (formData, itemId) => {
    try {
      if (itemId) {
        await updateSinopticoItem(itemId, formData);
      } else {
        await createNewChildItem(formData, formData.parentId, formData.rootProductId, formData.type);
      }
      fetchHierarchy();
    } catch (error) {
      console.error("Error saving item", error);
      setError("Error al guardar el item.");
    }
  };

  const handleQuickUpdate = useCallback((itemId, field, value) => {
    const updateNodeRecursively = (nodes) => {
      return nodes.map(node => {
        if (node.id === itemId) {
          return { ...node, [field]: value };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateNodeRecursively(node.children) };
        }
        return node;
      });
    };
    setHierarchy(prevHierarchy => updateNodeRecursively(prevHierarchy));
  }, []);

  const renderHeader = () => (
    <div className="grid grid-cols-9 gap-4 px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-t-lg">
      <div className="col-span-3">Nombre</div>
      <div>Código</div>
      <div>Tipo</div>
      <div>Version</div>
      <div>Cód. Cliente</div>
      <div>Peso</div>
      <div>Medidas</div>
      {editMode && <div className="col-span-1">Acciones</div>}
    </div>
  );

  const handleExportCSV = () => {
    exportToCSV(hierarchy, `sinoptico-${rootProduct?.codigo || 'export'}.csv`);
  };

  const handleExportPDF = () => {
    exportToPDF(hierarchy, `sinoptico-${rootProduct?.codigo || 'export'}.pdf`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate('/productos')} className="text-blue-600 hover:underline">
            &larr; Volver a Productos
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={handleExportCSV} className="px-4 py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700">
              Exportar a CSV
            </button>
            <button onClick={handleExportPDF} className="px-4 py-2 rounded-md text-white font-semibold bg-red-600 hover:bg-red-700">
              Exportar a PDF
            </button>
            <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-md text-white font-semibold ${editMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editMode ? 'Salir del Modo Edición' : 'Editar Jerarquía'}
            </button>
          </div>
        </div>

        {loading && <GridSkeletonLoader count={10} />}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          !hierarchy || hierarchy.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{rootProduct?.nombre || rootProduct?.descripcion || 'Producto'}</h1>
              <EmptyState title="Sin Jerarquía" message="Este sinóptico aún no tiene una familia o jerarquía creada." />
              {rootProduct && (
                <button onClick={() => handleOpenModal(null, { parentId: rootProduct.id, rootProductId: rootProduct.id, type: 'subproducto' })} className="mt-4 px-6 py-2 text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none">
                  Añadir Primer Item
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">{rootProduct?.nombre || rootProduct?.descripcion}</h1>
                <p className="text-sm text-gray-500">Creado por: <span className="font-semibold">{rootProduct?.createdBy || 'N/A'}</span> el {rootProduct?.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}</p>
                <p className="text-sm text-gray-500">Última mod.: <span className="font-semibold">{rootProduct?.lastModifiedBy || 'N/A'}</span> el {rootProduct?.lastModifiedAt?.toDate()?.toLocaleDateString() || 'N/A'}</p>
              </div>
              <div className="border rounded-lg overflow-hidden">
                {renderHeader()}
                <div className="divide-y divide-gray-200">
                  {hierarchy.map(node => (
                    <SinopticoNode key={node.id} node={node} level={0} editMode={editMode} onEdit={handleOpenModal} onOpenAuditLog={handleOpenAuditLogModal} onQuickUpdate={handleQuickUpdate} />
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>
      <SinopticoItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} allItems={allItems} {...modalInitialState} />
      <AuditLogModal isOpen={isAuditLogModalOpen} onClose={handleCloseAuditLogModal} itemId={auditedItemId} />
    </div>
  );
};

export default SinopticoPage;
