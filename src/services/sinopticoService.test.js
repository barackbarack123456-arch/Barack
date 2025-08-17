import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHierarchyForProduct, moveSinopticoItem, createNewChildItem, createNewProduct } from './sinopticoService';

// Mock the dependencies from firebase and other services
vi.mock('./firebase', () => ({
  db: {}, // Mock db object
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn((db, collection, id) => `mock/doc/${id}`),
  getDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('./modules/sinopticoItemsService', () => ({
  addSinopticoItem: vi.fn(),
  updateSinopticoItem: vi.fn(),
}));

// Import the mocked functions to be able to reference them in tests
import { db, getDocs, getDoc, writeBatch, doc, orderBy } from './firebase';
import { addSinopticoItem, updateSinopticoItem } from './modules/sinopticoItemsService';

// Mock implementation for the batch
const mockBatch = {
  update: vi.fn(),
  commit: vi.fn(),
};

describe('sinopticoService', () => {

  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    vi.clearAllMocks();
    // also reset batch mocks
    mockBatch.update.mockClear();
    mockBatch.commit.mockClear();
    writeBatch.mockReturnValue(mockBatch);
  });

  describe('getHierarchyForProduct', () => {

    it('should correctly build a hierarchical tree from a flat list', async () => {
      const mockFamilyItems = [
        { id: 'root1', parentId: null, rootProductId: 'root1', nombre: 'Root Product' },
        { id: 'child1', parentId: 'root1', rootProductId: 'root1', nombre: 'Subproducto 1' },
        { id: 'child2', parentId: 'root1', rootProductId: 'root1', nombre: 'Subproducto 2' },
        { id: 'grandchild1', parentId: 'child1', rootProductId: 'root1', nombre: 'Insumo 1.1' },
      ];
      const mockSnapshot = {
        docs: mockFamilyItems.map(item => ({ id: item.id, data: () => ({ ...item }) })),
        empty: false,
      };
      getDocs.mockResolvedValue(mockSnapshot);

      const tree = await getHierarchyForProduct('root1');

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('root1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].id).toBe('child1');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].id).toBe('grandchild1');
      expect(tree[0].children[1].id).toBe('child2');
      expect(tree[0].children[1].children).toHaveLength(0);
    });

    it('should return null if no items are found for the rootProductId', async () => {
      const mockSnapshot = { docs: [], empty: true };
      getDocs.mockResolvedValue(mockSnapshot);
      // Also mock the direct getDoc call to return nothing
      getDoc.mockResolvedValue({ exists: () => false });

      const tree = await getHierarchyForProduct('nonexistent');
      expect(tree).toBeNull();
    });

    it('should handle orphaned items (invalid parentId) as root nodes', async () => {
      const mockFamilyItems = [
        { id: 'root1', parentId: null, rootProductId: 'root1', nombre: 'Root Product' },
        { id: 'orphan1', parentId: 'nonexistentParent', rootProductId: 'root1', nombre: 'Orphan' },
      ];
      const mockSnapshot = {
        docs: mockFamilyItems.map(item => ({ id: item.id, data: () => ({ ...item }) })),
        empty: false,
      };
      getDocs.mockResolvedValue(mockSnapshot);

      const tree = await getHierarchyForProduct('root1');

      // Expect two items at the root level
      expect(tree).toHaveLength(2);
      expect(tree.map(node => node.id)).toContain('root1');
      expect(tree.map(node => node.id)).toContain('orphan1');
    });

    it('should handle circular dependencies by breaking the cycle', async () => {
      const mockCircularItems = [
        { id: 'itemA', parentId: 'itemB', rootProductId: 'root1', nombre: 'Item A' },
        { id: 'itemB', parentId: 'itemA', rootProductId: 'root1', nombre: 'Item B' },
      ];
      const mockSnapshot = {
        docs: mockCircularItems.map(item => ({ id: item.id, data: () => ({ ...item }) })),
        empty: false,
      };
      getDocs.mockResolvedValue(mockSnapshot);

      const tree = await getHierarchyForProduct('root1');

      // The fixed implementation should detect the cycle, break it,
      // and return both items as root-level nodes.
      expect(tree).toHaveLength(2);
      expect(tree.map(node => node.id)).toEqual(expect.arrayContaining(['itemA', 'itemB']));
      // Ensure the children array was cleared to break the cycle
      const itemA = tree.find(n => n.id === 'itemA');
      const itemB = tree.find(n => n.id === 'itemB');
      expect(itemA.children).toHaveLength(0);
      expect(itemB.children).toHaveLength(0);
    });
  });

  describe('moveSinopticoItem', () => {
    it('should update parent, order, and reorder old siblings on reparent', async () => {
      // Arrange
      const itemToMove = { id: 'item2', parentId: 'parent1', orden: 1 };
      const oldSiblings = [
        { id: 'item1', parentId: 'parent1', orden: 0 },
        itemToMove,
        { id: 'item3', parentId: 'parent1', orden: 2 },
      ];
      const newSiblings = [{ id: 'item4', parentId: 'parent2', orden: 0 }];

      // Mock the main item we are moving
      getDoc.mockResolvedValue({ exists: () => true, data: () => itemToMove });

      // Mock the queries for old and new siblings
      getDocs.mockImplementation((query) => {
        // This is a simplified mock, assuming query inspection if needed
        // For this test, we can return different sets based on call order or inspect the query
        if (getDocs.mock.calls.length === 1) { // First call is for new siblings
          return Promise.resolve({ docs: newSiblings.map(d => ({ id: d.id, data: () => d })), size: newSiblings.length });
        }
        // Second call is for old siblings
        return Promise.resolve({ docs: oldSiblings.map(d => ({ id: d.id, data: () => d })), size: oldSiblings.length });
      });

      // Act
      await moveSinopticoItem('item2', 'parent2');

      // Assert
      expect(writeBatch).toHaveBeenCalledTimes(1);

      // 1. Check update on the moved item
      expect(mockBatch.update).toHaveBeenCalledWith(
        'mock/doc/item2',
        expect.objectContaining({ parentId: 'parent2', orden: 1 }) // new parent, new order is 1 (after item4)
      );

      // 2. Check updates on the old siblings that need reordering
      expect(mockBatch.update).toHaveBeenCalledWith(
        'mock/doc/item3',
        { orden: 1 } // item3's order should be updated from 2 to 1
      );

      // 3. Ensure item1 was not updated as its order was correct
      expect(mockBatch.update).not.toHaveBeenCalledWith(
        'mock/doc/item1',
        expect.anything()
      );

      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('createNewChildItem', () => {
    it('should call addSinopticoItem with the correct data structure', async () => {
      const itemData = { nombre: 'New Insumo', codigo: 'INS-01' };
      const userId = 'user123';

      await createNewChildItem(itemData, 'parent1', 'root1', 'insumo', userId);

      expect(addSinopticoItem).toHaveBeenCalledTimes(1);
      const calledWith = addSinopticoItem.mock.calls[0][0];
      expect(calledWith.nombre).toBe('New Insumo');
      expect(calledWith.parentId).toBe('parent1');
      expect(calledWith.rootProductId).toBe('root1');
      expect(calledWith.type).toBe('insumo');
      expect(calledWith.createdBy).toBe(userId);
      expect(calledWith).toHaveProperty('createdAt');
    });

    it('should throw an error if parentId is missing', async () => {
      await expect(createNewChildItem({}, null, 'root1', 'subproducto')).rejects.toThrow(
        'A child item must have a parent and a root product ID.'
      );
    });
  });

  describe('createNewProduct', () => {
    it('should create an item and then update it with its own ID as rootProductId', async () => {
      const productData = { nombre: 'New Product', codigo: 'PROD-01' };
      const userId = 'user123';
      const newId = 'newProductId';

      // Mock the add call to return a new ID
      addSinopticoItem.mockResolvedValue(newId);

      await createNewProduct(productData, userId);

      // Expect addSinopticoItem to be called first
      expect(addSinopticoItem).toHaveBeenCalledTimes(1);
      const addCallData = addSinopticoItem.mock.calls[0][0];
      expect(addCallData.type).toBe('producto');
      expect(addCallData.parentId).toBeNull();

      // Expect updateSinopticoItem to be called second with the new ID
      expect(updateSinopticoItem).toHaveBeenCalledTimes(1);
      expect(updateSinopticoItem).toHaveBeenCalledWith(newId, { rootProductId: newId });
    });
  });
});
