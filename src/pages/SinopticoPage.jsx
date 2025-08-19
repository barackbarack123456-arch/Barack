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
  arrayMove,
} from '@dnd-kit/sortable';
import { getHierarchyForProduct, createNewChildItem, moveSinopticoItem, updateItemsOrder, addExistingItemsAsChildren } from '../services/sinopticoService';
import { updateSinopticoItem, getSinopticoItems } from '../services/modules/sinopticoItemsService';
import { getProyectoById } from '../services/modules/proyectosService';
import { exportToCSV, exportToPDF } from '../utils/fileExporters';
import EmptyState from '../components/EmptyState';
import GridSkeletonLoader from '../components/GridSkeletonLoader';
import SinopticoNode from '../components/SinopticoNode';
import DraggableSinopticoNode from '../components/DraggableSinopticoNode';
import SinopticoItemModal from '../components/SinopticoItemModal';
import AddItemFromDBModal from '../components/AddItemFromDBModal';
import AuditLogModal from '../components/AuditLogModal';
import { useFlattenedTree } from '../hooks/useFlattenedTree';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';
import Caratula from '../components/Caratula';

const SinopticoPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  const [hierarchy, setHierarchy] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [rootProduct, setRootProduct] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalInitialState, setModalInitialState] = useState({});
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [auditedItemId, setAuditedItemId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [levelFilters, setLevelFilters] = useState([]);

  const flattenedTree = useFlattenedTree(hierarchy, collapsedNodes);

  const filteredFlattenedTree = useMemo(() => {
    if (levelFilters.length === 0) {
      return flattenedTree;
    }
    return flattenedTree.filter(item => levelFilters.includes(item.level));
  }, [flattenedTree, levelFilters]);

  const flattenedTreeIds = useMemo(() => filteredFlattenedTree.map(item => item.id), [filteredFlattenedTree]);

  const maxLevel = useMemo(() => {
    if (!flattenedTree || flattenedTree.length === 0) return 0;
    return Math.max(...flattenedTree.map(item => item.level));
  }, [flattenedTree]);

  const handleLevelFilterChange = (level) => {
    setLevelFilters(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

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
      const [tree, { data: allItemsData }] = await Promise.all([
        getHierarchyForProduct(productId),
        getSinopticoItems()
      ]);

      setHierarchy(tree);
      setAllItems(allItemsData);

      const rootItem = allItemsData.find(item => item.id === productId);
      setRootProduct(rootItem);

      if (rootItem && rootItem.proyecto) {
        const project = await getProyectoById(rootItem.proyecto);
        setProjectData(project);
      }

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

    const previousHierarchy = JSON.parse(JSON.stringify(hierarchy));

    const activeNode = flattenedTree.find(item => item.id === active.id);
    const overNode = flattenedTree.find(item => item.id === over.id);

    if (!activeNode || !overNode) return;

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

    // Scenario 1: Reordering within the same parent
    if (activeNode.parentId === overNode.parentId) {
      setHierarchy(currentHierarchy => {
        const findSiblingsAndParent = (nodes, parentId) => {
          if (parentId === null) return { siblings: nodes, parent: null };
          for (const node of nodes) {
            if (node.id === parentId) return { siblings: node.children, parent: node };
            if (node.children) {
              const found = findSiblingsAndParent(node.children, parentId);
              if (found.siblings) return found;
            }
          }
          return { siblings: null, parent: null };
        };

        const newHierarchy = JSON.parse(JSON.stringify(currentHierarchy));
        const { siblings, parent } = findSiblingsAndParent(newHierarchy, activeNode.parentId);

        if (!siblings) return currentHierarchy;

        const oldIndex = siblings.findIndex(item => item.id === active.id);
        const newIndex = siblings.findIndex(item => item.id === over.id);

        const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex);

        if (parent) {
          parent.children = reorderedSiblings;
        } else {
          // This means we are reordering root nodes
          return reorderedSiblings;
        }
        return newHierarchy;
      });

      const siblings = findNode(hierarchy, activeNode.parentId)?.children || hierarchy;
      const oldIndex = siblings.findIndex(item => item.id === active.id);
      const newIndex = siblings.findIndex(item => item.id === over.id);
      const reordered = arrayMove(siblings, oldIndex, newIndex);
      const itemsToUpdate = reordered.map((item, index) => ({ id: item.id, orden: index }));

      try {
        await updateItemsOrder(itemsToUpdate);
        // Maybe refetch to ensure consistency
        // fetchHierarchy();
      } catch (err) {
        setError('Error al reordenar. Se restauró el orden anterior.');
        console.error(err);
        setHierarchy(previousHierarchy);
      }
    } else { // Scenario 2: Reparenting
      const newParentId = over.id;

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

      const nodeToMoveData = findNode(hierarchy, active.id);

      if (nodeToMoveData && (isDescendant(nodeToMoveData, newParentId) || newParentId === active.id)) {
        setError("Operación no válida: no se puede mover un elemento para que sea descendiente de sí mismo.");
        return;
      }

      // Optimistic UI Update
      setHierarchy(oldHierarchy => {
        const newHierarchy = JSON.parse(JSON.stringify(oldHierarchy));
        let nodeToMove = null;

        const findAndRemove = (nodes, nodeId) => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === nodeId) {
              nodeToMove = nodes.splice(i, 1)[0];
              return true;
            }
            if (nodes[i].children && findAndRemove(nodes[i].children, nodeId)) {
              return true;
            }
          }
          return false;
        };

        findAndRemove(newHierarchy, active.id);
        if (!nodeToMove) return oldHierarchy;

        const findAndAdd = (nodes, parentId, nodeToAdd) => {
          for (const node of nodes) {
            if (node.id === parentId) {
              if (!node.children) node.children = [];
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
        await moveSinopticoItem(active.id, newParentId, rootProduct.id);
        // fetchHierarchy(); // Refetch to ensure data consistency after complex operation
      } catch (err) {
        setError('Error al mover el item. La jerarquía ha sido restaurada.');
        console.error(err);
        setHierarchy(previousHierarchy);
      }
    }
  };

  const renderHeader = () => (
    <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-t-lg">
      <div className="col-span-2">Nombre</div>
      <div>Código</div>
      <div>Cantidad</div>
      <div>Unidad de Medida</div>
      <div className="col-span-2">Comentarios</div>
      <div>Tipo</div>
      <div>Version</div>
      <div>Cód. Cliente</div>
      <div>Peso</div>
      <div>Medidas</div>
      {editMode && <div className="col-span-1">Acciones</div>}
    </div>
  );

  const handleExportCSV = () => {
    exportToCSV(hierarchy, `sinoptico-${rootProduct?.codigo || 'export'}.csv`, addNotification);
  };

  const handleExportPDF = () => {
    exportToPDF(hierarchy, `sinoptico-${rootProduct?.codigo || 'export'}.pdf`, addNotification);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <Caratula rootProduct={rootProduct} projectData={projectData} />
        <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
          <button onClick={() => navigate('/productos')} className="text-blue-600 hover:underline">
            &larr; Volver a Productos
          </button>
          <div className="flex items-center">
            {editMode && (
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="px-4 py-2 rounded-md text-white font-semibold bg-blue-600 hover:bg-blue-700"
              >
                Añadir Componente Existente
              </button>
            )}
            <div className={`flex items-center space-x-2 ${editMode ? 'pl-4 ml-4 border-l border-gray-300' : ''}`}>
              <button onClick={handleExportCSV} className="px-4 py-2 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700" disabled={loading || error || !hierarchy || hierarchy.length === 0}>
                Exportar a CSV
              </button>
              <button onClick={handleExportPDF} className="px-4 py-2 rounded-md text-white font-semibold bg-red-600 hover:bg-red-700" disabled={loading || error || !hierarchy || hierarchy.length === 0}>
                Exportar a PDF
              </button>
              <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-md text-white font-semibold ${editMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`} disabled={loading || error}>
                {editMode ? 'Salir del Modo Edición' : 'Editar Jerarquía'}
              </button>
            </div>
          </div>
        </div>

        {loading && <GridSkeletonLoader count={10} />}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          !hierarchy || hierarchy.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{rootProduct?.nombre || rootProduct?.descripcion || 'Producto'}</h1>
              <EmptyState title="Sin Jerarquía" message="Este sinóptico aún no tiene una familia o jerarquía creada." />
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
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Filtrar por Nivel</h3>
                    <div className="flex items-center space-x-4">
                      {[...Array(maxLevel + 1).keys()].slice(1).map(level => (
                        <label key={level} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={levelFilters.includes(level)}
                            onChange={() => handleLevelFilterChange(level)}
                          />
                          <span>Nivel {level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {editMode && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-md" role="alert">
                      <p className="font-bold">Modo Edición Activado</p>
                    </div>
                  )}
                  <div className="border rounded-lg">
                    {renderHeader()}
                    <div className="divide-y divide-gray-200">
                      {filteredFlattenedTree.map((node) => (
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
                          disabled={node.level === 0 || !editMode}
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
      <AddItemFromDBModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItems={async (selectedIds) => {
          try {
            await addExistingItemsAsChildren(selectedIds, rootProduct.id, rootProduct.id, currentUser.uid);
            addNotification('Items añadidos correctamente.', 'success');
            fetchHierarchy();
          } catch (error) {
            addNotification('Error al añadir los items.', 'error');
            console.error("Error adding items as children:", error);
          }
        }}
        parentId={rootProduct?.id}
        rootProductId={rootProduct?.id}
      />
      <AuditLogModal isOpen={isAuditLogModalOpen} onClose={handleCloseAuditLogModal} itemId={auditedItemId} />
    </div>
  );
};

export default SinopticoPage;
