import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { getHierarchyForProduct, createNewChildItem, moveSinopticoItem } from '../services/sinopticoService';
import { updateSinopticoItem, getSinopticoItems } from '../services/modules/sinopticoItemsService';
import { exportToCSV, exportToPDF } from '../utils/fileExporters';
import EmptyState from '../components/EmptyState';
import GridSkeletonLoader from '../components/GridSkeletonLoader';
import SinopticoNode from '../components/SinopticoNode';
import DraggableSinopticoNode from '../components/DraggableSinopticoNode';
import SinopticoItemModal from '../components/SinopticoItemModal';
import AuditLogModal from '../components/AuditLogModal';
import { useFlattenedTree } from '../hooks/useFlattenedTree';

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
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  const flattenedTree = useFlattenedTree(hierarchy, collapsedNodes);
  const flattenedTreeIds = useMemo(() => flattenedTree.map(item => item.id), [flattenedTree]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    setOverId(event.over?.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

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

  const handleToggleNode = useCallback((nodeId) => {
    setCollapsedNodes(prevCollapsed => {
      const newSet = new Set(prevCollapsed);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleDragEnd = async (event) => {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const previousHierarchy = hierarchy;
    const activeId = active.id;
    const overId = over.id;

    // For simplicity, we'll only allow re-parenting for now.
    // A more complex logic would handle re-ordering as well.
    const newParentId = overId;

    // --- Start of change: Cycle detection ---
    const findNode = (nodes, nodeId) => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children, nodeId);
          if (found) return found;
        }
      }
      return null;
    };

    const isDescendant = (ancestor, descendantId) => {
      if (!ancestor.children) return false;
      if (ancestor.children.some(child => child.id === descendantId)) return true;
      return ancestor.children.some(child => isDescendant(child, descendantId));
    };

    const nodeToMoveData = findNode(hierarchy, activeId);

    if (nodeToMoveData && (isDescendant(nodeToMoveData, newParentId) || newParentId === activeId)) {
        setError("Operación no válida: no se puede mover un elemento para que sea descendiente de sí mismo.");
        return;
    }
    // --- End of change: Cycle detection ---

    // Optimistically update the UI
    setHierarchy(oldHierarchy => {
      const newHierarchy = JSON.parse(JSON.stringify(oldHierarchy));
      let nodeToMove = null;

      // Find and remove the node from its current position
      const findAndRemove = (nodes, nodeId) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.id === nodeId) {
            nodeToMove = nodes.splice(i, 1)[0];
            return true;
          }
          if (node.children && findAndRemove(node.children, nodeId)) {
            return true;
          }
        }
        return false;
      };

      findAndRemove(newHierarchy, activeId);

      if (!nodeToMove) return oldHierarchy; // Should not happen

      // Find the new parent and add the node
      const findAndAdd = (nodes, parentId, nodeToAdd) => {
        for (const node of nodes) {
          if (node.id === parentId) {
            if (!node.children) {
              node.children = [];
            }
            node.children.push(nodeToAdd);
            return true;
          }
          if (node.children && findAndAdd(node.children, parentId, nodeToAdd)) {
            return true;
          }
        }
        return false;
      };

      findAndAdd(newHierarchy, newParentId, nodeToMove);

      return newHierarchy;
    });

    try {
      await moveSinopticoItem(activeId, newParentId, rootProduct.id);
      // On success, we can refetch to be in sync, but for now we trust the optimistic update
      // fetchHierarchy();
    } catch (err) {
      setError('Error al mover el item. La jerarquía ha sido restaurada.');
      console.error(err);
      // If the API call fails, revert to the previous state
      setHierarchy(previousHierarchy);
    }
  };

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={flattenedTreeIds} strategy={verticalListSortingStrategy}>
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-gray-800">{rootProduct?.nombre || rootProduct?.descripcion}</h1>
                    <p className="text-sm text-gray-500">Creado por: <span className="font-semibold">{rootProduct?.createdBy || 'N/A'}</span> el {rootProduct?.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Última mod.: <span className="font-semibold">{rootProduct?.lastModifiedBy || 'N/A'}</span> el {rootProduct?.lastModifiedAt?.toDate()?.toLocaleDateString() || 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    {renderHeader()}
                    <div className="divide-y divide-gray-200">
                      {flattenedTree.map((node) => (
                        <DraggableSinopticoNode
                          key={node.id}
                          node={node}
                          level={node.level}
                          isLastChild={node.isLastChild}
                          editMode={editMode}
                          onEdit={handleOpenModal}
                          onOpenAuditLog={handleOpenAuditLogModal}
                          onQuickUpdate={handleQuickUpdate}
                          isOver={overId === node.id}
                          disabled={!editMode}
                          isCollapsed={collapsedNodes.has(node.id)}
                          onToggleNode={handleToggleNode}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div style={{
                    '--tw-ring-color': 'rgba(59, 130, 246, 0.5)',
                    boxShadow: '0 0 0 calc(1px + var(--tw-ring-offset-width, 0px)) var(--tw-ring-color), 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    opacity: 0.9,
                    borderRadius: '0.5rem',
                    pointerEvents: 'none',
                  }}>
                    <SinopticoNode
                      node={flattenedTree.find(item => item.id === activeId)}
                      level={0}
                      editMode={false}
                      onEdit={() => {}}
                      onQuickUpdate={() => {}}
                      onOpenAuditLog={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )
        )}
      </div>
      <SinopticoItemModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} allItems={allItems} {...modalInitialState} />
      <AuditLogModal isOpen={isAuditLogModalOpen} onClose={handleCloseAuditLogModal} itemId={auditedItemId} />
    </div>
  );
};

export default SinopticoPage;
