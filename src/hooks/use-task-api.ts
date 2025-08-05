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

  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<TaskWithDetails | null> => {
      setIsLoading(true)

      try {
        const response = await fetch('/api/tasks', {
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
    []
  )

  const updateTask = async (
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<TaskWithDetails | null> => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
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
      const response = await fetch(`/api/tasks/${taskId}`, {
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
      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
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

        const response = await fetch(`/api/tasks?${searchParams.toString()}`)

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
    []
  )

  const getTask = async (taskId: string): Promise<TaskWithDetails | null> => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`)

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
