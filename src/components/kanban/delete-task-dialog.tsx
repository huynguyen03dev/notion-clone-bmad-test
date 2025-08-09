'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { TaskWithDetails } from '@/types/task';
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

interface DeleteTaskDialogProps {
  task: TaskWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteTaskDialog({
  task,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteTaskDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!task) return;
    
    setIsProcessing(true);
    try {
      await onConfirm(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing && !isDeleting) {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Task
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>"{task.title}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. The task will be permanently removed from the board.
            </p>
            {task.description && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground font-medium mb-1">Task Description:</p>
                <p className="text-xs text-foreground/80 line-clamp-3">
                  {task.description}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isProcessing || isDeleting}
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing || isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isProcessing || isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
