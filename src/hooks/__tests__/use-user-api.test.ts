import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserApi } from '../use-user-api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUsers = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar1.jpg',
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://example.com/avatar2.jpg',
  },
];

describe('useUserApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches users on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    const { result } = renderHook(() => useUserApi());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/users');
  });

  it('handles fetch error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe('Network error');
    expect(consoleSpy).toHaveBeenCalledWith('Fetch users error:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles HTTP error response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch users');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('handles empty users response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}), // No users property
    });

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('refetches users when refetch is called', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual(mockUsers);

    // Refetch with new data
    const newUsers = [
      ...mockUsers,
      {
        id: 'user-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: newUsers }),
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.users).toEqual(newUsers);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('sets loading state during refetch', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock delayed refetch
    let resolveRefetch: (value: any) => void;
    const refetchPromise = new Promise((resolve) => {
      resolveRefetch = resolve;
    });
    mockFetch.mockReturnValueOnce(refetchPromise);

    act(() => {
      result.current.refetch();
    });

    // Should be loading during refetch
    expect(result.current.isLoading).toBe(true);

    // Complete the refetch
    await act(async () => {
      resolveRefetch!({
        ok: true,
        json: async () => ({ users: mockUsers }),
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('clears error on successful refetch', async () => {
    // Initial fetch fails
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserApi());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Successful refetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: mockUsers }),
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.users).toEqual(mockUsers);
    });

    consoleSpy.mockRestore();
  });
});
