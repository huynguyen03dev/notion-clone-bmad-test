import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskApi } from '../use-task-api'
// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  columnId: 'column-1',
  boardId: 'board-1',
  assigneeId: null,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  position: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assignee: null,
  column: {
    id: 'column-1',
    name: 'To Do',
    color: null,
  },
  board: {
    id: 'board-1',
    name: 'Test Board',
  },
}

describe('useTaskApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('creates a task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask }),
      })

      const { result } = renderHook(() => useTaskApi())

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        columnId: 'column-1',
        boardId: 'board-1',
        priority: TaskPriority.HIGH,
      }

      let createdTask
      await act(async () => {
        createdTask = await result.current.createTask(taskData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      expect(createdTask).toEqual(mockTask)
    })

    it('handles create task error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create task' }),
      })

      const { result } = renderHook(() => useTaskApi())

      const taskData = {
        title: 'New Task',
        columnId: 'column-1',
        boardId: 'board-1',
      }

      let createdTask
      await act(async () => {
        createdTask = await result.current.createTask(taskData)
      })

      expect(createdTask).toBeNull()
    })
  })

  describe('updateTask', () => {
    it('updates a task successfully', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: updatedTask }),
      })

      const { result } = renderHook(() => useTaskApi())

      const updateData = { title: 'Updated Task' }

      let updated
      await act(async () => {
        updated = await result.current.updateTask('task-1', updateData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      expect(updated).toEqual(updatedTask)
    })

    it('handles update task error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to update task' }),
      })

      const { result } = renderHook(() => useTaskApi())

      let updated
      await act(async () => {
        updated = await result.current.updateTask('task-1', {
          title: 'Updated',
        })
      })

      expect(updated).toBeNull()
    })
  })

  describe('deleteTask', () => {
    it('deletes a task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useTaskApi())

      let deleted
      await act(async () => {
        deleted = await result.current.deleteTask('task-1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-1', {
        method: 'DELETE',
      })

      expect(deleted).toBe(true)
    })

    it('handles delete task error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete task' }),
      })

      const { result } = renderHook(() => useTaskApi())

      let deleted
      await act(async () => {
        deleted = await result.current.deleteTask('task-1')
      })

      expect(deleted).toBe(false)
    })
  })

  describe('duplicateTask', () => {
    it('duplicates a task successfully', async () => {
      const duplicatedTask = {
        ...mockTask,
        id: 'task-2',
        title: 'Test Task (Copy)',
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: duplicatedTask }),
      })

      const { result } = renderHook(() => useTaskApi())

      let duplicated
      await act(async () => {
        duplicated = await result.current.duplicateTask('task-1', 'column-2', 5)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-1/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columnId: 'column-2', position: 5 }),
      })

      expect(duplicated).toEqual(duplicatedTask)
    })
  })

  describe('getTasks', () => {
    it('fetches tasks successfully', async () => {
      const tasksResponse = {
        tasks: [mockTask],
        total: 1,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tasksResponse,
      })

      const { result } = renderHook(() => useTaskApi())

      const filters = {
        boardId: 'board-1',
        columnId: 'column-1',
        sortBy: 'position' as const,
        sortOrder: 'asc' as const,
      }

      let tasks
      await act(async () => {
        tasks = await result.current.getTasks(filters)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks?boardId=board-1&columnId=column-1&sortBy=position&sortOrder=asc'
      )
      expect(tasks).toEqual(tasksResponse)
    })

    it('handles fetch tasks error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch tasks' }),
      })

      const { result } = renderHook(() => useTaskApi())

      let tasks
      await act(async () => {
        tasks = await result.current.getTasks()
      })

      expect(tasks).toBeNull()
    })
  })

  describe('getTask', () => {
    it('fetches a single task successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask }),
      })

      const { result } = renderHook(() => useTaskApi())

      let task
      await act(async () => {
        task = await result.current.getTask('task-1')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-1')
      expect(task).toEqual(mockTask)
    })

    it('handles fetch task error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Task not found' }),
      })

      const { result } = renderHook(() => useTaskApi())

      let task
      await act(async () => {
        task = await result.current.getTask('task-1')
      })

      expect(task).toBeNull()
    })
  })

  describe('loading state', () => {
    it('sets loading state during API calls', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValueOnce(promise)

      const { result } = renderHook(() => useTaskApi())

      expect(result.current.isLoading).toBe(false)

      act(() => {
        result.current.createTask({
          title: 'Test',
          columnId: 'column-1',
          boardId: 'board-1',
        })
      })

      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ task: mockTask }),
        })
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})
