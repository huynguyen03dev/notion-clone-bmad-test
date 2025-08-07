'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useMemo, useCallback } from 'react'
import { TaskWithDetails } from '@/types/task'

// Types for task data
interface TasksParams {
  columnId?: string
  boardId?: string
  sortBy?: 'position' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

interface TasksResponse {
  tasks: TaskWithDetails[]
  total: number
}

// Query keys for React Query
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  byColumn: (columnId: string, boardId: string) =>
    [...taskKeys.lists(), { columnId, boardId }] as const,
}

// Fetch tasks function
async function fetchTasks(params: TasksParams = {}): Promise<TasksResponse> {
  const {
    columnId,
    boardId,
    sortBy = 'position',
    sortOrder = 'asc',
    limit = 100,
  } = params

  const searchParams = new URLSearchParams()
  if (columnId) searchParams.set('columnId', columnId)
  if (boardId) searchParams.set('boardId', boardId)
  searchParams.set('sortBy', sortBy)
  searchParams.set('sortOrder', sortOrder)
  searchParams.set('limit', limit.toString())

  console.log('🔍 React Query: Fetching tasks with params:', params)

  const response = await fetch(`/api/tasks?${searchParams}`)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tasks: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  console.log(
    '✅ React Query: Successfully fetched tasks:',
    data.tasks?.length || 0
  )

  return data
}

// Custom hook for fetching tasks by column
export function useColumnTasks(columnId: string, boardId: string) {
  const { data: session, status } = useSession()

  // 🔧 FIX: Memoize query key to prevent infinite re-execution
  const queryKey = useMemo(
    () => taskKeys.byColumn(columnId, boardId),
    [columnId, boardId]
  )

  // 🔧 FIX: Memoize query function to prevent infinite re-execution
  const queryFn = useCallback(
    () =>
      fetchTasks({
        columnId,
        boardId,
        sortBy: 'position',
        sortOrder: 'asc',
      }),
    [columnId, boardId]
  )

  return useQuery({
    queryKey,
    queryFn,
    enabled:
      status === 'authenticated' &&
      !!session?.user?.id &&
      !!columnId &&
      !!boardId,
    staleTime: 5 * 60 * 1000, // 🔧 INCREASED: 5 minutes to prevent frequent refetches
    gcTime: 10 * 60 * 1000, // 🔧 INCREASED: 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // 🔧 DISABLED: Prevent automatic refetch on reconnect
    refetchInterval: false, // 🔧 DISABLED: Prevent automatic polling
    refetchIntervalInBackground: false, // 🔧 DISABLED: Prevent background polling
    retry: false, // 🔧 DISABLED: Prevent retries that might cause loops
  })
}

// Custom hook for fetching all tasks with filters
export function useTasks(params: TasksParams = {}) {
  const { data: session, status } = useSession()

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => fetchTasks(params),
    enabled: status === 'authenticated' && !!session?.user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Custom hook for creating a task
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: {
      title: string
      description?: string
      columnId: string
      boardId: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      dueDate?: string
    }) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to create task: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate tasks for the specific column
      queryClient.invalidateQueries({
        queryKey: taskKeys.byColumn(variables.columnId, variables.boardId),
      })
      // Also invalidate general task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Custom hook for updating a task
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      ...taskData
    }: {
      taskId: string
      title?: string
      description?: string
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      dueDate?: string
      columnId?: string
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to update task: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update the specific task in cache
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.taskId),
      })
      // Invalidate all task lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Custom hook for deleting a task
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(
          `Failed to delete task: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: (data, taskId) => {
      // Remove the task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

// Custom hook for duplicating a task
export function useDuplicateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      boardId,
    }: {
      taskId: string
      columnId: string
      boardId: string
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columnId }),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to duplicate task: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate tasks for the specific column
      queryClient.invalidateQueries({
        queryKey: taskKeys.byColumn(variables.columnId, variables.boardId),
      })
      // Also invalidate general task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
