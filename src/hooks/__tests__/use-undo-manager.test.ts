import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoManager } from '../use-undo-manager';
import { TaskWithDetails } from '@/types/task';

// Define TaskPriority enum for tests
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

const mockTask: TaskWithDetails = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  columnId: 'column-1',
  boardId: 'board-1',
  assigneeId: null,
  priority: TaskPriority.MEDIUM,
  dueDate: null,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  assignee: null,
  column: { id: 'column-1', name: 'To Do', color: '#3b82f6' },
  board: { id: 'board-1', name: 'Test Board' },
};

describe('useUndoManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useUndoManager());

    expect(result.current.undoStack).toEqual([]);
    expect(result.current.currentUndo).toBeNull();
  });

  it('adds task deletion to undo stack', () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    expect(result.current.undoStack).toHaveLength(1);
    expect(result.current.currentUndo).toBeTruthy();
    expect(result.current.currentUndo?.type).toBe('delete');
    expect(result.current.currentUndo?.description).toBe('Deleted "Test Task"');
  });

  it('adds bulk task deletion to undo stack', () => {
    const { result } = renderHook(() => useUndoManager());

    const deletedTasks = [
      { task: mockTask, originalPosition: 0, originalColumnId: 'column-1' },
      { task: { ...mockTask, id: 'task-2', title: 'Task 2' }, originalPosition: 1, originalColumnId: 'column-1' },
    ];

    act(() => {
      result.current.addBulkTaskDeletion(deletedTasks);
    });

    expect(result.current.undoStack).toHaveLength(1);
    expect(result.current.currentUndo).toBeTruthy();
    expect(result.current.currentUndo?.type).toBe('bulk_delete');
    expect(result.current.currentUndo?.description).toBe('Deleted 2 tasks');
  });

  it('handles single task deletion description correctly', () => {
    const { result } = renderHook(() => useUndoManager());

    const singleTask = [
      { task: mockTask, originalPosition: 0, originalColumnId: 'column-1' },
    ];

    act(() => {
      result.current.addBulkTaskDeletion(singleTask);
    });

    expect(result.current.currentUndo?.description).toBe('Deleted 1 task');
  });

  it('auto-clears current undo after timeout', () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    expect(result.current.currentUndo).toBeTruthy();

    // Fast-forward time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentUndo).toBeNull();
  });

  it('clears current undo manually', () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    expect(result.current.currentUndo).toBeTruthy();

    act(() => {
      result.current.clearCurrentUndo();
    });

    expect(result.current.currentUndo).toBeNull();
  });

  it('executes undo for single task deletion', async () => {
    const { result } = renderHook(() => useUndoManager());
    const mockRestoreTask = vi.fn().mockResolvedValue(undefined);
    const mockRestoreTasks = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    const success = await act(async () => {
      return result.current.executeUndo(mockRestoreTask, mockRestoreTasks);
    });

    expect(success).toBe(true);
    expect(mockRestoreTask).toHaveBeenCalledWith(mockTask, 'column-1', 0);
    expect(mockRestoreTasks).not.toHaveBeenCalled();
    expect(result.current.currentUndo).toBeNull();
    expect(result.current.undoStack).toHaveLength(0);
  });

  it('executes undo for bulk task deletion', async () => {
    const { result } = renderHook(() => useUndoManager());
    const mockRestoreTask = vi.fn().mockResolvedValue(undefined);
    const mockRestoreTasks = vi.fn().mockResolvedValue(undefined);

    const deletedTasks = [
      { task: mockTask, originalPosition: 0, originalColumnId: 'column-1' },
      { task: { ...mockTask, id: 'task-2' }, originalPosition: 1, originalColumnId: 'column-1' },
    ];

    act(() => {
      result.current.addBulkTaskDeletion(deletedTasks);
    });

    const success = await act(async () => {
      return result.current.executeUndo(mockRestoreTask, mockRestoreTasks);
    });

    expect(success).toBe(true);
    expect(mockRestoreTasks).toHaveBeenCalledWith(deletedTasks);
    expect(mockRestoreTask).not.toHaveBeenCalled();
    expect(result.current.currentUndo).toBeNull();
    expect(result.current.undoStack).toHaveLength(0);
  });

  it('handles undo execution errors', async () => {
    const { result } = renderHook(() => useUndoManager());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockRestoreTask = vi.fn().mockRejectedValue(new Error('Restore failed'));
    const mockRestoreTasks = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    const success = await act(async () => {
      return result.current.executeUndo(mockRestoreTask, mockRestoreTasks);
    });

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to execute undo:', expect.any(Error));
    expect(result.current.currentUndo).toBeTruthy(); // Should not clear on error

    consoleSpy.mockRestore();
  });

  it('returns false when no current undo action', async () => {
    const { result } = renderHook(() => useUndoManager());
    const mockRestoreTask = vi.fn();
    const mockRestoreTasks = vi.fn();

    const success = await act(async () => {
      return result.current.executeUndo(mockRestoreTask, mockRestoreTasks);
    });

    expect(success).toBe(false);
    expect(mockRestoreTask).not.toHaveBeenCalled();
    expect(mockRestoreTasks).not.toHaveBeenCalled();
  });

  it('maintains maximum of 10 actions in stack', () => {
    const { result } = renderHook(() => useUndoManager());

    // Add 12 actions
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.addTaskDeletion(
          { ...mockTask, id: `task-${i}`, title: `Task ${i}` },
          i,
          'column-1'
        );
      });
    }

    // Should only keep the last 10
    expect(result.current.undoStack).toHaveLength(10);
    
    // The first two actions should be removed
    const taskIds = result.current.undoStack.map(action => action.data.task.id);
    expect(taskIds).not.toContain('task-0');
    expect(taskIds).not.toContain('task-1');
    expect(taskIds).toContain('task-11');
  });

  it('handles unsupported undo action types', async () => {
    const { result } = renderHook(() => useUndoManager());
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockRestoreTask = vi.fn();
    const mockRestoreTasks = vi.fn();

    // Manually add an unsupported action type
    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    // Modify the action type to something unsupported
    const currentUndo = result.current.currentUndo;
    if (currentUndo) {
      currentUndo.type = 'unsupported' as any;
    }

    const success = await act(async () => {
      return result.current.executeUndo(mockRestoreTask, mockRestoreTasks);
    });

    expect(success).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Unsupported undo action type:', 'unsupported');

    consoleSpy.mockRestore();
  });

  it('clears timeout when new action is added', () => {
    const { result } = renderHook(() => useUndoManager());

    act(() => {
      result.current.addTaskDeletion(mockTask, 0, 'column-1');
    });

    const firstUndo = result.current.currentUndo;

    // Add another action before timeout
    act(() => {
      vi.advanceTimersByTime(2000); // 2 seconds
      result.current.addTaskDeletion({ ...mockTask, id: 'task-2' }, 1, 'column-1');
    });

    const secondUndo = result.current.currentUndo;
    expect(secondUndo?.id).not.toBe(firstUndo?.id);

    // The first timeout should be cleared, so advancing by 3 more seconds
    // (total 5 seconds from first action) should not clear the current undo
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.currentUndo).toBeTruthy();

    // But advancing by 2 more seconds (5 seconds from second action) should clear it
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.currentUndo).toBeNull();
  });
});
