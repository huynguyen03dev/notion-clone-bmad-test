import { BoardCard } from './board-card';
import { BoardWithDetails } from '@/types/board';
import { Skeleton } from '@/components/ui/skeleton';

interface BoardGridProps {
  boards: BoardWithDetails[];
  onBoardUpdated: (board: BoardWithDetails) => void;
  onBoardDeleted: (boardId: string) => void;
  loading?: boolean;
}

export function BoardGrid({ boards, onBoardUpdated, onBoardDeleted, loading = false }: BoardGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Boards</h2>
        <span className="text-sm text-muted-foreground">
          {boards.length} board{boards.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onBoardUpdated={onBoardUpdated}
            onBoardDeleted={onBoardDeleted}
          />
        ))}
      </div>
    </div>
  );
}

function BoardCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
