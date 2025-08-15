import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useData from './useData';

// Mock fetcher functions
const mockSuccessFetcher = vi.fn(() => Promise.resolve(['data1', 'data2']));
const mockErrorFetcher = vi.fn(() => Promise.reject(new Error('Failed to fetch')));

describe('useData hook', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct initial state and fetch data', async () => {
    const { result } = renderHook(() => useData(mockSuccessFetcher));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(['data1', 'data2']);
  });

  it('should handle fetch error', async () => {
    // Suppress console.error for this test as we expect an error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useData(mockErrorFetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toEqual(new Error('Failed to fetch'));
    expect(mockErrorFetcher).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('should refetch data when refetch is called', async () => {
    const { result } = renderHook(() => useData(mockSuccessFetcher));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockSuccessFetcher).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(['data1', 'data2']);
    expect(mockSuccessFetcher).toHaveBeenCalledTimes(2);
  });

  it('should re-fetch when dependencies change', async () => {
    const fetcher = vi.fn((id) => Promise.resolve(`data for ${id}`));
    const { result, rerender } = renderHook(({ id }) => useData(() => fetcher(id), [id]), {
      initialProps: { id: 1 },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith(1);
    expect(result.current.data).toBe('data for 1');

    // Rerender with new props
    rerender({ id: 2 });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith(2);
    expect(result.current.data).toBe('data for 2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
