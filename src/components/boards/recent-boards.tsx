import { BoardCard } from './board-card';
import { BoardWithDetails } from '@/types/board';

interface RecentBoardsProps {
  boards: BoardWithDetails[];
  onBoardUpdated: (board: BoardWithDetails) => void;
  onBoardDeleted: (boardId: string) => void;
}

export function RecentBoards({ boards, onBoardUpdated, onBoardDeleted }: RecentBoardsProps) {
  if (boards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Boards</h2>
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
