import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  TaskWithDetails,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
} from '@/types/task'

interface TasksResponse {
  tasks: TaskWithDetails[]
  total: number
  filters?: TaskFilters
}

export function useTaskApi() {
  const [isLoading, setIsLoading] = useState(false)

  // Ensure relative URLs work in Node/jsdom test environments
  const resolveUrl = useCallback((path: string) => {
    if (/^https?:\/\//i.test(path)) return path
    try {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return new URL(path, window.location.origin).toString()
      }
    } catch {}
    const base =
      process.env.TEST_BASE_URL ||
      process.env.VITE_TEST_BASE_URL ||
      'http://localhost:3000'
    return new URL(path, base).toString()
  }, [])

  // Try relative first (helps tests that assert on fetch args),
  // then fall back to absolute URL if the environment requires it (Node/undici)
  const safeFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      try {
        return await fetch(path, init)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (
          msg.includes('Invalid URL') ||
          msg.includes('Failed to parse URL')
        ) {
          return await fetch(resolveUrl(path), init)
        }
        throw e
      }
    },
    [resolveUrl]
  )

  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<TaskWithDetails | null> => {
      setIsLoading(true)

      try {
        const response = await safeFetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create task')
        }

        const result = await response.json()
        toast.success('Task created successfully')
        return result.task
      } catch (error) {
        console.error('Create task error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to create task'
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [safeFetch]
  )

  const updateTask = async (
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<TaskWithDetails | null> => {
    setIsLoading(true)

    try {
      const response = await safeFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const result = await response.json()
      toast.success('Task updated successfully')
      return result.task
    } catch (error) {
      console.error('Update task error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update task'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTask = async (taskId: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await safeFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      toast.success('Task deleted successfully')
      return true
    } catch (error) {
      console.error('Delete task error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete task'
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const duplicateTask = async (
    taskId: string,
    columnId?: string,
    position?: number
  ): Promise<TaskWithDetails | null> => {
    setIsLoading(true)

    try {
      const response = await safeFetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columnId, position }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate task')
      }

      const result = await response.json()
      toast.success('Task duplicated successfully')
      return result.task
    } catch (error) {
      console.error('Duplicate task error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to duplicate task'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getTasks = useCallback(
    async (filters?: TaskFilters): Promise<TasksResponse | null> => {
      setIsLoading(true)

      try {
        const searchParams = new URLSearchParams()

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value))
            }
          })
        }

        const response = await safeFetch(
          `/api/tasks?${searchParams.toString()}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch tasks')
        }

        const result = await response.json()
        return result
      } catch (error) {
        console.error('Fetch tasks error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to fetch tasks'
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [safeFetch]
  )

  const getTask = async (taskId: string): Promise<TaskWithDetails | null> => {
    setIsLoading(true)

    try {
      const response = await safeFetch(`/api/tasks/${taskId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch task')
      }

      const result = await response.json()
      return result.task
    } catch (error) {
      console.error('Fetch task error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch task'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    getTasks,
    getTask,
    isLoading,
  }
}
