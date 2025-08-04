import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface EmptyStateProps {
  onCreateBoard: () => void;
  hasSearch?: boolean;
}

export function EmptyState({ onCreateBoard, hasSearch = false }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No boards found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your search terms or create a new board.
        </p>
        <Button onClick={onCreateBoard}>
          <Plus className="h-4 w-4 mr-2" />
          Create Board
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get started by creating your first kanban board to organize your projects and tasks.
        </p>
      </div>
      
      <Button onClick={onCreateBoard} size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Create Your First Board
      </Button>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>💡 Tip: You can organize different projects with separate boards</p>
      </div>
    </div>
  );
}
