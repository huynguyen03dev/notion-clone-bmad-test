'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { BoardWithDetails } from '@/types/board'

// Types for API responses
interface BoardsResponse {
  boards: BoardWithDetails[]
  total: number
}

interface BoardsParams {
  search?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

// Query keys for React Query
export const boardsKeys = {
  all: ['boards'] as const,
  lists: () => [...boardsKeys.all, 'list'] as const,
  list: (params: BoardsParams) => [...boardsKeys.lists(), params] as const,
  details: () => [...boardsKeys.all, 'detail'] as const,
  detail: (id: string) => [...boardsKeys.details(), id] as const,
}

// Fetch boards function - this will be used by React Query
async function fetchBoards(params: BoardsParams = {}): Promise<BoardsResponse> {
  const {
    search = '',
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    limit = 20,
  } = params

  const searchParams = new URLSearchParams({
    search,
    sortBy,
    sortOrder,
    limit: limit.toString(),
  })

  console.log('🔍 React Query: Fetching boards with params:', params)

  const response = await fetch(`/api/boards?${searchParams}`)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch boards: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()
  console.log(
    '✅ React Query: Successfully fetched boards:',
    data.boards?.length || 0
  )

  return data
}

// Custom hook for fetching boards with React Query
export function useBoards(params: BoardsParams = {}) {
  const { data: session, status } = useSession()

  return useQuery({
    queryKey: boardsKeys.list(params),
    queryFn: () => fetchBoards(params),
    enabled: status === 'authenticated' && !!session?.user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

// Custom hook for creating a new board
export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (boardData: { name: string; description?: string }) => {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardData),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to create board: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch boards list
      queryClient.invalidateQueries({ queryKey: boardsKeys.lists() })
    },
  })
}

// Custom hook for updating a board
export function useUpdateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...boardData
    }: {
      id: string
      name?: string
      description?: string
    }) => {
      const response = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardData),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to update board: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch boards list
      queryClient.invalidateQueries({ queryKey: boardsKeys.lists() })
      // Update the specific board in cache
      queryClient.invalidateQueries({
        queryKey: boardsKeys.detail(variables.id),
      })
    },
  })
}

// Custom hook for deleting a board
export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/boards/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(
          `Failed to delete board: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch boards list
      queryClient.invalidateQueries({ queryKey: boardsKeys.lists() })
    },
  })
}
