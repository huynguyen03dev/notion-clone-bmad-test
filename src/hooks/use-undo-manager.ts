import { useState, useCallback, useRef } from 'react';
import { TaskWithDetails } from '@/types/task';

interface UndoAction {
  id: string;
  type: 'delete' | 'bulk_delete' | 'move' | 'update';
  data: any;
  timestamp: number;
  description: string;
}

interface DeletedTaskData {
  task: TaskWithDetails;
  originalPosition: number;
  originalColumnId: string;
}

interface BulkDeletedTasksData {
  tasks: DeletedTaskData[];
}

export function useUndoManager() {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [currentUndo, setCurrentUndo] = useState<UndoAction | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addUndoAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const undoAction: UndoAction = {
      ...action,
      id: `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setUndoStack(prev => [...prev.slice(-9), undoAction]); // Keep last 10 actions
    setCurrentUndo(undoAction);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Auto-clear after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setCurrentUndo(null);
    }, 5000);
  }, []);

  const clearCurrentUndo = useCallback(() => {
    setCurrentUndo(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeUndo = useCallback(async (
    restoreTask: (task: TaskWithDetails, columnId: string, position: number) => Promise<void>,
    restoreTasks: (tasks: DeletedTaskData[]) => Promise<void>
  ) => {
    if (!currentUndo) return false;

    try {
      switch (currentUndo.type) {
        case 'delete': {
          const data = currentUndo.data as DeletedTaskData;
          await restoreTask(data.task, data.originalColumnId, data.originalPosition);
          break;
        }
        case 'bulk_delete': {
          const data = currentUndo.data as BulkDeletedTasksData;
          await restoreTasks(data.tasks);
          break;
        }
        default:
          console.warn('Unsupported undo action type:', currentUndo.type);
          return false;
      }

      // Remove the undone action from stack
      setUndoStack(prev => prev.filter(action => action.id !== currentUndo.id));
      clearCurrentUndo();
      return true;
    } catch (error) {
      console.error('Failed to execute undo:', error);
      return false;
    }
  }, [currentUndo, clearCurrentUndo]);

  // Helper functions for creating specific undo actions
  const addTaskDeletion = useCallback((
    task: TaskWithDetails, 
    originalPosition: number, 
    originalColumnId: string
  ) => {
    addUndoAction({
      type: 'delete',
      data: {
        task,
        originalPosition,
        originalColumnId,
      } as DeletedTaskData,
      description: `Deleted "${task.title}"`,
    });
  }, [addUndoAction]);

  const addBulkTaskDeletion = useCallback((tasks: DeletedTaskData[]) => {
    addUndoAction({
      type: 'bulk_delete',
      data: {
        tasks,
      } as BulkDeletedTasksData,
      description: `Deleted ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
    });
  }, [addUndoAction]);

  return {
    undoStack,
    currentUndo,
    addTaskDeletion,
    addBulkTaskDeletion,
    clearCurrentUndo,
    executeUndo,
  };
}
