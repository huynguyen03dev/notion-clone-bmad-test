'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

// Types for board data
interface Board {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  _count: {
    tasks: number;
    columns: number;
  };
}

interface Column {
  id: string;
  name: string;
  color?: string | null;
  position: number;
  _count: {
    tasks: number;
  };
}

interface BoardResponse {
  board: Board;
}

interface ColumnsResponse {
  columns: Column[];
}

// Query keys for React Query
export const boardKeys = {
  all: ['boards'] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
  columns: (boardId: string) => [...boardKeys.detail(boardId), 'columns'] as const,
};

// Fetch single board function
async function fetchBoard(boardId: string): Promise<BoardResponse> {
  console.log('🔍 React Query: Fetching board:', boardId);
  
  const response = await fetch(`/api/boards/${boardId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Board not found');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to view this board');
    }
    throw new Error(`Failed to fetch board: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ React Query: Successfully fetched board:', data.board?.name);
  
  return data;
}

// Fetch board columns function
async function fetchBoardColumns(boardId: string): Promise<ColumnsResponse> {
  console.log('🔍 React Query: Fetching columns for board:', boardId);
  
  const response = await fetch(`/api/boards/${boardId}/columns`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch columns: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ React Query: Successfully fetched columns:', data.columns?.length || 0);
  
  return data;
}

// Custom hook for fetching a single board
export function useBoard(boardId: string) {
  const { data: session, status } = useSession();
  
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => fetchBoard(boardId),
    enabled: status === 'authenticated' && !!session?.user?.id && !!boardId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('permission'))) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Custom hook for fetching board columns
export function useBoardColumns(boardId: string) {
  const { data: session, status } = useSession();
  
  return useQuery({
    queryKey: boardKeys.columns(boardId),
    queryFn: () => fetchBoardColumns(boardId),
    enabled: status === 'authenticated' && !!session?.user?.id && !!boardId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Custom hook for updating board
export function useUpdateBoard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ boardId, ...boardData }: { boardId: string; name?: string; description?: string }) => {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update board: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the specific board in cache
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
      // Also invalidate the boards list
      queryClient.invalidateQueries({ queryKey: ['boards', 'list'] });
    },
  });
}

// Custom hook for deleting board
export function useDeleteBoard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (boardId: string) => {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete board: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, boardId) => {
      // Remove the board from cache
      queryClient.removeQueries({ queryKey: boardKeys.detail(boardId) });
      // Invalidate the boards list
      queryClient.invalidateQueries({ queryKey: ['boards', 'list'] });
    },
  });
}
