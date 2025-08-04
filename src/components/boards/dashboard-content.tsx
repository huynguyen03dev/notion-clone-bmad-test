'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { BoardGrid } from './board-grid';
import { BoardCreateModal } from './board-create-modal';
import { BoardSearch } from './board-search';
import { EmptyState } from './empty-state';
import { RecentBoards } from './recent-boards';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BoardWithDetails, BoardFilters } from '@/types/board';
import { toast } from 'sonner';

export function DashboardContent() {
  const { data: session } = useSession();
  const [boards, setBoards] = useState<BoardWithDetails[]>([]);
  const [recentBoards, setRecentBoards] = useState<BoardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<BoardFilters>({
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    limit: 20,
    offset: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const filtersRef = useRef(filters);

  // Update ref when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);



  // Initial load - only run once when session is available
  useEffect(() => {
    if (!session?.user?.id || hasLoaded) return;

    // Inline the fetch to avoid function reference issues
    const loadInitialBoards = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchParams = new URLSearchParams({
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: '20',
          offset: '0',
        });

        const response = await fetch(`/api/boards?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch boards');
        }

        const data = await response.json();
        setBoards(data.boards);
        setRecentBoards(data.boards.slice(0, 5));
        setHasLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Failed to load boards:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialBoards();
  }, [session?.user?.id, hasLoaded]); // Only depend on user ID and hasLoaded



  // Handle search - use useCallback to create stable reference
  const handleSearch = useCallback(async (search: string) => {
    const newFilters = { ...filtersRef.current, search, offset: 0 };
    setFilters(newFilters);

    // Inline fetch to avoid dependency issues
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (newFilters.search) searchParams.set('search', newFilters.search);
      if (newFilters.sortBy) searchParams.set('sortBy', newFilters.sortBy);
      if (newFilters.sortOrder) searchParams.set('sortOrder', newFilters.sortOrder);
      if (newFilters.limit) searchParams.set('limit', newFilters.limit.toString());
      if (newFilters.offset) searchParams.set('offset', newFilters.offset.toString());

      const response = await fetch(`/api/boards?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }

      const data = await response.json();
      setBoards(data.boards);

      // Set recent boards (first 5 boards sorted by updatedAt)
      if (!newFilters.search) {
        setRecentBoards(data.boards.slice(0, 5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies to create stable reference

  // Handle sort change - use useCallback to create stable reference
  const handleSortChange = useCallback(async (sortBy: 'name' | 'createdAt' | 'updatedAt', sortOrder: 'asc' | 'desc') => {
    const newFilters = { ...filtersRef.current, sortBy, sortOrder, offset: 0 };
    setFilters(newFilters);

    // Inline fetch to avoid dependency issues
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (newFilters.search) searchParams.set('search', newFilters.search);
      if (newFilters.sortBy) searchParams.set('sortBy', newFilters.sortBy);
      if (newFilters.sortOrder) searchParams.set('sortOrder', newFilters.sortOrder);
      if (newFilters.limit) searchParams.set('limit', newFilters.limit.toString());
      if (newFilters.offset) searchParams.set('offset', newFilters.offset.toString());

      const response = await fetch(`/api/boards?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }

      const data = await response.json();
      setBoards(data.boards);

      // Set recent boards (first 5 boards sorted by updatedAt)
      if (!newFilters.search) {
        setRecentBoards(data.boards.slice(0, 5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependencies to create stable reference

  // Handle board creation
  const handleBoardCreated = (newBoard: BoardWithDetails) => {
    setBoards(prev => [newBoard, ...prev]);
    setRecentBoards(prev => [newBoard, ...prev.slice(0, 4)]);
    setIsCreateModalOpen(false);
    toast.success('Board created successfully');
  };

  // Handle board update
  const handleBoardUpdated = (updatedBoard: BoardWithDetails) => {
    setBoards(prev => prev.map(board =>
      board.id === updatedBoard.id ? updatedBoard : board
    ));
    setRecentBoards(prev => prev.map(board =>
      board.id === updatedBoard.id ? updatedBoard : board
    ));
    toast.success('Board updated successfully');
  };

  // Handle board deletion
  const handleBoardDeleted = (boardId: string) => {
    setBoards(prev => prev.filter(board => board.id !== boardId));
    setRecentBoards(prev => prev.filter(board => board.id !== boardId));
    toast.success('Board deleted successfully');
  };

  if (loading && boards.length === 0) {
    return <div>Loading...</div>;
  }

  if (error && boards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <BoardSearch 
          onSearch={handleSearch}
          onSortChange={handleSortChange}
          currentSort={{ sortBy: filters.sortBy!, sortOrder: filters.sortOrder! }}
        />
        <Button onClick={() => setIsCreateModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Create Board
        </Button>
      </div>

      {/* Recent Boards Section */}
      {recentBoards.length > 0 && !filters.search && (
        <RecentBoards 
          boards={recentBoards}
          onBoardUpdated={handleBoardUpdated}
          onBoardDeleted={handleBoardDeleted}
        />
      )}

      {/* Main Boards Grid */}
      {boards.length > 0 ? (
        <BoardGrid 
          boards={boards}
          onBoardUpdated={handleBoardUpdated}
          onBoardDeleted={handleBoardDeleted}
          loading={loading}
        />
      ) : (
        <EmptyState 
          onCreateBoard={() => setIsCreateModalOpen(true)}
          hasSearch={!!filters.search}
        />
      )}

      {/* Create Board Modal */}
      <BoardCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  );
}
