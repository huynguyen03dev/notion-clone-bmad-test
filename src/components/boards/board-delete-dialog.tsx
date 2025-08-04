'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { BoardWithDetails } from '@/types/board';
import { toast } from 'sonner';

interface BoardDeleteDialogProps {
  board: BoardWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardDeleted: (boardId: string) => void;
}

export function BoardDeleteDialog({ board, open, onOpenChange, onBoardDeleted }: BoardDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete board');
      }

      onBoardDeleted(board.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Board deletion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete board');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Board</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                Are you sure you want to delete "{board.name}"?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">This action will permanently delete:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• The board and all its settings</li>
              <li>• All {board._count.columns} columns</li>
              <li>• All {board._count.tasks} tasks and their data</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This action cannot be undone.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Board
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
