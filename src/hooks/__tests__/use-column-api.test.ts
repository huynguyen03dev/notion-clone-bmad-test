import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnApi } from '../use-column-api'

// Mock fetch
global.fetch = vi.fn()

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useColumnApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createColumn', () => {
    it('should create column successfully', async () => {
      const mockColumn = {
        id: 'column-1',
        name: 'New Column',
        boardId: 'board-1',
        position: 0,
        color: '#3B82F6',
        _count: { tasks: 0 },
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ column: mockColumn }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let createdColumn: any
      await act(async () => {
        createdColumn = await result.current.createColumn({
          name: 'New Column',
          boardId: 'board-1',
          color: '#3B82F6',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Column',
          boardId: 'board-1',
          color: '#3B82F6',
        }),
      })

      expect(createdColumn).toEqual(mockColumn)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle create column error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Column limit reached' }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let createdColumn: any
      await act(async () => {
        createdColumn = await result.current.createColumn({
          name: 'New Column',
          boardId: 'board-1',
        })
      })

      expect(createdColumn).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateColumn', () => {
    it('should update column successfully', async () => {
      const mockColumn = {
        id: 'column-1',
        name: 'Updated Column',
        boardId: 'board-1',
        position: 0,
        color: '#10B981',
        _count: { tasks: 2 },
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ column: mockColumn }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let updatedColumn: any
      await act(async () => {
        updatedColumn = await result.current.updateColumn('column-1', {
          name: 'Updated Column',
          color: '#10B981',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/columns/column-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Column',
          color: '#10B981',
        }),
      })

      expect(updatedColumn).toEqual(mockColumn)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle position update without success toast', async () => {
      const mockColumn = {
        id: 'column-1',
        name: 'Column',
        boardId: 'board-1',
        position: 1,
        _count: { tasks: 2 },
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ column: mockColumn }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      await act(async () => {
        await result.current.updateColumn('column-1', {
          position: 1,
        })
      })

      // Position updates shouldn't show success toast
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should handle position conflict errors', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Position conflict detected. Please try again.',
        }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let updatedColumn: any
      await act(async () => {
        updatedColumn = await result.current.updateColumn('column-1', {
          position: 2,
        })
      })

      expect(updatedColumn).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('deleteColumn', () => {
    it('should delete column successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let deleteResult: boolean
      await act(async () => {
        deleteResult = await result.current.deleteColumn('column-1', {
          taskAction: 'delete',
        })
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/columns/column-1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskAction: 'delete',
        }),
      })

      expect(deleteResult).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle delete column error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete last column' }),
      } as Response)

      const { result } = renderHook(() => useColumnApi())

      let deleteResult: boolean
      await act(async () => {
        deleteResult = await result.current.deleteColumn('column-1', {
          taskAction: 'delete',
        })
      })

      expect(deleteResult).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('loading state', () => {
    it('should manage loading state correctly', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ column: {} }),
                } as Response),
              100
            )
          )
      )

      const { result } = renderHook(() => useColumnApi())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.createColumn({
          name: 'Test',
          boardId: 'board-1',
        })
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})
