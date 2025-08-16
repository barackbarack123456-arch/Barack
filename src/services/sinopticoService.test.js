import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHierarchyForProduct, moveSinopticoItem, createNewChildItem, createNewProduct } from './sinopticoService';

// Mock the dependencies from firebase and other services
vi.mock('./firebase', () => ({
  db: {}, // Mock db object
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock('./modules/sinopticoItemsService', () => ({
  addSinopticoItem: vi.fn(),
  updateSinopticoItem: vi.fn(),
}));

// Import the mocked functions to be able to reference them in tests
import { db, getDocs, getDoc, writeBatch, doc } from './firebase';
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
    it('should perform a simple update if moving within the same root product', async () => {
      // Arrange: Mock that the item exists and has a rootProductId
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ rootProductId: 'root1' }),
      });

      // Act: Move the item to a new parent but within the same root
      await moveSinopticoItem('itemToMove', 'newParent', 'root1');

      // Assert: Should call the single update function, not a batch
      expect(updateSinopticoItem).toHaveBeenCalledTimes(1);
      expect(updateSinopticoItem).toHaveBeenCalledWith('itemToMove', { parentId: 'newParent' });
      expect(writeBatch).not.toHaveBeenCalled();
    });

    it('should use a batch write to update item and descendants when moving to a new root product', async () => {
      // Arrange: Mock the item being moved and its descendants
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ rootProductId: 'oldRoot' }),
      });
      const mockDescendants = [
        { id: 'descendant1', parentId: 'itemToMove', rootProductId: 'oldRoot' },
        { id: 'descendant2', parentId: 'descendant1', rootProductId: 'oldRoot' },
      ];
      const mockSnapshot = {
        docs: mockDescendants.map(item => ({ id: item.id, data: () => item })),
      };
      getDocs.mockResolvedValue(mockSnapshot);

      // Act: Move the item to a new parent in a new root
      await moveSinopticoItem('itemToMove', 'newParent', 'newRoot');

      // Assert: Should use a batch write
      expect(writeBatch).toHaveBeenCalledTimes(1);
      expect(updateSinopticoItem).not.toHaveBeenCalled();

      // Check that the batch updates the main item + all descendants (3 updates total)
      expect(mockBatch.update).toHaveBeenCalledTimes(3);

      // Check the main item's update
      expect(mockBatch.update).toHaveBeenCalledWith(
        doc(db, 'productos', 'itemToMove'),
        { parentId: 'newParent', rootProductId: 'newRoot' }
      );
      // Check the descendants' updates
      expect(mockBatch.update).toHaveBeenCalledWith(
        doc(db, 'productos', 'descendant1'),
        { rootProductId: 'newRoot' }
      );
       expect(mockBatch.update).toHaveBeenCalledWith(
        doc(db, 'productos', 'descendant2'),
        { rootProductId: 'newRoot' }
      );

      // Ensure the batch is committed
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
