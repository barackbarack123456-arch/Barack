import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuickUpdate } from './useQuickUpdate';
import { updateSinopticoItem } from '../services/modules/sinopticoItemsService';

// Mock the service dependency
vi.mock('../services/modules/sinopticoItemsService', () => ({
  updateSinopticoItem: vi.fn(),
}));

describe('useQuickUpdate hook', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateSinopticoItem and return true on successful update', async () => {
    // Arrange
    updateSinopticoItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useQuickUpdate());
    let success;

    // Act
    await act(async () => {
      success = await result.current.updateField('item-123', 'nombre', 'New Name');
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(updateSinopticoItem).toHaveBeenCalledTimes(1);
    expect(updateSinopticoItem).toHaveBeenCalledWith('item-123', { nombre: 'New Name' });
    expect(success).toBe(true);
  });

  it('should set error state and return false on failed update', async () => {
    // Arrange
    const mockError = new Error('Update failed');
    updateSinopticoItem.mockRejectedValue(mockError);
    const { result } = renderHook(() => useQuickUpdate());
    let success;
     // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await act(async () => {
      success = await result.current.updateField('item-123', 'codigo', 'FAIL-01');
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(mockError);
    expect(updateSinopticoItem).toHaveBeenCalledTimes(1);
    expect(updateSinopticoItem).toHaveBeenCalledWith('item-123', { codigo: 'FAIL-01' });
    expect(success).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('should set loading state to true during the update process', async () => {
    // Arrange
    let resolvePromise;
    updateSinopticoItem.mockReturnValue(new Promise(resolve => {
      resolvePromise = resolve;
    }));
    const { result } = renderHook(() => useQuickUpdate());

    // Act
    let updatePromise;
    act(() => {
      updatePromise = result.current.updateField('item-123', 'nombre', 'Temp Name');
    });

    // Assert right after calling, before resolving
    expect(result.current.loading).toBe(true);

    // Act to resolve the promise
    await act(async () => {
      resolvePromise();
      await updatePromise;
    });

    // Assert after promise is resolved
    expect(result.current.loading).toBe(false);
  });
});
