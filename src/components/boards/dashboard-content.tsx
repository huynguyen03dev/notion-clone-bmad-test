'use client'

import { useState, useCallback } from 'react'
import { BoardGrid } from './board-grid'
import { BoardCreateModal } from './board-create-modal'
import { BoardSearch } from './board-search'
import { EmptyState } from './empty-state'
import { RecentBoards } from './recent-boards'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { BoardWithDetails } from '@/types/board'
import { toast } from 'sonner'
import { useBoards } from '@/hooks/use-boards'

export function DashboardContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentSearch, setCurrentSearch] = useState('')
  const [currentSort, setCurrentSort] = useState<{
    sortBy: 'name' | 'createdAt' | 'updatedAt'
    sortOrder: 'asc' | 'desc'
  }>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })

  // 🚀 REACT QUERY SOLUTION: Replace all problematic useEffect logic with React Query
  const {
    data: boardsData,
    isLoading: loading,
    error,
    refetch,
  } = useBoards({
    search: currentSearch,
    sortBy: currentSort.sortBy,
    sortOrder: currentSort.sortOrder,
    limit: 20,
  })

  // Extract boards and recent boards from React Query data
  const boards = boardsData?.boards || []
  const recentBoards = currentSearch ? [] : boards.slice(0, 5)

  // 🎉 React Query handles fetching and cache invalidation automatically!

  // 🚀 REACT QUERY HANDLERS: Simple and clean, no manual state management needed!

  // Handle search - React Query will automatically refetch when currentSearch changes
  const handleSearch = useCallback((search: string) => {
    console.log('🔍 Handling search:', search)
    setCurrentSearch(search)
    // React Query will automatically refetch with new search params!
  }, [])

  // Handle sort change - React Query will automatically refetch when currentSort changes
  const handleSortChange = useCallback(
    (sortBy: 'name' | 'createdAt' | 'updatedAt', sortOrder: 'asc' | 'desc') => {
      console.log('📊 Handling sort change:', { sortBy, sortOrder })
      setCurrentSort({ sortBy, sortOrder })
      // React Query will automatically refetch with new sort params!
    },
    []
  )

  // Handle board creation: close modal and toast; React Query invalidation will refresh the list
  const handleBoardCreated = useCallback((_newBoard: BoardWithDetails) => {
    setIsCreateModalOpen(false)
    toast.success('Board created successfully')
  }, [])

  // Handle board update - React Query mutations handle cache updates automatically
  const handleBoardUpdated = useCallback((_updatedBoard: BoardWithDetails) => {
    toast.success('Board updated successfully')
    // React Query will handle cache updates automatically!
  }, [])

  // Handle board deletion - React Query mutations handle cache updates automatically
  const handleBoardDeleted = useCallback((_boardId: string) => {
    toast.success('Board deleted successfully')
    // React Query will handle cache updates automatically!
  }, [])

  if (loading && boards.length === 0) {
    return <div>Loading...</div>
  }

  if (error && boards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">
          {error instanceof Error ? error.message : 'Failed to load boards'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    )
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
      {recentBoards.length > 0 && !currentSearch && (
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
          hasSearch={!!currentSearch}
        />
      )}

      {/* Create Board Modal */}
      <BoardCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  )
}
