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
import { BoardWithDetails } from '@/types/board';
import { toast } from 'sonner';

export function DashboardContent() {
  const { data: session } = useSession();
  const [boards, setBoards] = useState<BoardWithDetails[]>([]);
  const [recentBoards, setRecentBoards] = useState<BoardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentSort, setCurrentSort] = useState<{ sortBy: 'name' | 'createdAt' | 'updatedAt'; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  const hasLoadedRef = useRef(false);
  const currentSearchRef = useRef(currentSearch);
  const currentSortRef = useRef(currentSort);

  // Update refs when state changes
  useEffect(() => {
    currentSearchRef.current = currentSearch;
  }, [currentSearch]);

  useEffect(() => {
    currentSortRef.current = currentSort;
  }, [currentSort]);

  // Fetch boards function - COMPLETELY STABLE with NO dependencies to prevent infinite loops
  const fetchBoards = useCallback(async (search: string = '', sortBy: 'name' | 'createdAt' | 'updatedAt' = 'updatedAt', sortOrder: 'asc' | 'desc' = 'desc') => {
    console.log('📡 fetchBoards called with:', { search, sortBy, sortOrder });

    // CIRCUIT BREAKER: If we've already made a successful API call, NEVER make another one unless it's a search
    if (circuitBreakerRef.current && !search) {
      console.log('🚫 CIRCUIT BREAKER: Preventing duplicate API call');
      return;
    }

    // Get session directly from hook to avoid dependency
    const currentSession = session;
    if (!currentSession?.user?.id) {
      console.log('❌ No session or user ID, aborting fetchBoards');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (search) searchParams.set('search', search);
      searchParams.set('sortBy', sortBy);
      searchParams.set('sortOrder', sortOrder);
      searchParams.set('limit', '20');
      searchParams.set('offset', '0');

      const response = await fetch(`/api/boards?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch boards');
      }

      const data = await response.json();
      setBoards(data.boards);

      // Set recent boards (first 5 boards sorted by updatedAt) only if no search
      if (!search) {
        setRecentBoards(data.boards.slice(0, 5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  }, []); // NO DEPENDENCIES - COMPLETELY STABLE

  // CIRCUIT BREAKER - Prevent infinite API calls
  const circuitBreakerRef = useRef(false);

  // Initial load - run only once when component mounts
  useEffect(() => {
    console.log('🔍 Initial load effect triggered, session?.user?.id:', session?.user?.id, 'hasLoadedRef.current:', hasLoadedRef.current, 'circuitBreaker:', circuitBreakerRef.current);

    // CIRCUIT BREAKER: If we've already made a successful API call, NEVER make another one
    if (circuitBreakerRef.current) {
      console.log('🚫 CIRCUIT BREAKER: Preventing API call - already made one');
      return;
    }

    // Check session inside the effect to avoid dependency
    if (!session?.user?.id || hasLoadedRef.current) {
      console.log('❌ Skipping initial load - no session or already loaded');
      return;
    }

    console.log('🚀 Running initial fetchBoards');
    hasLoadedRef.current = true;
    circuitBreakerRef.current = true; // ACTIVATE CIRCUIT BREAKER
    fetchBoards();
  }, []); // NO DEPENDENCIES - run only once on mount



  // Handle search - COMPLETELY STABLE with NO dependencies
  const handleSearch = useCallback(async (search: string) => {
    // Prevent unnecessary API calls if search hasn't changed
    if (currentSearchRef.current === search) {
      return;
    }

    setCurrentSearch(search);
    await fetchBoards(search, currentSortRef.current.sortBy, currentSortRef.current.sortOrder);
  }, []); // NO DEPENDENCIES - COMPLETELY STABLE

  // Handle sort change - COMPLETELY STABLE with NO dependencies
  const handleSortChange = useCallback(async (sortBy: 'name' | 'createdAt' | 'updatedAt', sortOrder: 'asc' | 'desc') => {
    // Prevent unnecessary API calls if sort hasn't changed
    if (currentSortRef.current.sortBy === sortBy && currentSortRef.current.sortOrder === sortOrder) {
      return;
    }

    setCurrentSort({ sortBy, sortOrder });
    await fetchBoards(currentSearchRef.current, sortBy, sortOrder);
  }, []); // NO DEPENDENCIES - COMPLETELY STABLE

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
          currentSort={currentSort}
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
