'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './sortable-task-card';
import { TaskWithDetails } from '@/types/task';
// 🚨 EMERGENCY FIX: Temporarily disable React Query to stop infinite loop
// import { useColumnTasks, useDeleteTask, useDuplicateTask } from '@/hooks/use-task-data';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useTaskApi } from '@/hooks/use-task-api';

interface TaskListProps {
  columnId: string;
  boardId: string;
  onTaskEdit?: (task: TaskWithDetails) => void;
  onTaskClick?: (task: TaskWithDetails) => void;
  onTaskDelete?: (task: TaskWithDetails) => void;
  onAddTask?: (columnId: string) => void;
  onTasksUpdated?: () => void;
  selectedTasks?: Set<string>;
  onTaskSelect?: (taskId: string, selected: boolean) => void;
  showBulkSelection?: boolean;
  refreshKey?: number;
}

export function TaskList({
  columnId,
  boardId,
  onTaskEdit,
  onTaskClick,
  onTaskDelete,
  onAddTask,
  onTasksUpdated,
  selectedTasks = new Set(),
  onTaskSelect,
  showBulkSelection = false,
  refreshKey,
}: TaskListProps) {
  console.log('🔥 TaskList component rendered for column:', columnId);

  // Local UI state
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const isLoading = loading;

  // Use shared API hook so tests can mock network calls easily
  const { getTasks, deleteTask, duplicateTask } = useTaskApi();

  const fetchTasks = useCallback(async () => {
    if (!columnId || !boardId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getTasks({
        columnId,
        boardId,
        sortBy: 'position',
        sortOrder: 'asc',
      });

      setTasks(data?.tasks || []);
    } catch (err) {
      console.error('TaskList: failed to load tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [columnId, boardId, getTasks]);

  // 🔧 STABLE EFFECT: Only run when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Refetch when parent signals a refresh (e.g., after drag-and-drop)
  useEffect(() => {
    if (refreshKey !== undefined) {
      fetchTasks();
    }
  }, [refreshKey, fetchTasks]);

  // 🚨 SIMPLE HANDLERS: No complex mutations, just basic operations
  const handleTaskDelete = async (taskId: string) => {
    try {
      const ok = await deleteTask(taskId);
      if (!ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(task => task.id !== taskId));
      onTasksUpdated?.();
    } catch (error) {
      console.error('TaskList: failed to delete task:', error);
    }
  };

  const handleTaskDuplicate = async (taskId: string) => {
    try {
      const duplicated = await duplicateTask(taskId, columnId);
      if (duplicated) {
        await fetchTasks();
        onTasksUpdated?.();
      }
    } catch (error) {
      console.error('TaskList: failed to duplicate task:', error);
    }
  };

  const handleAddTask = () => {
    onAddTask?.(columnId);
  };

  // 🚀 REACT QUERY SOLUTION: Simple refetch instead of complex refresh logic
  // const refreshTasks = () => {
  //   console.log('🔄 Refreshing tasks for column:', columnId);
  //   fetchTasks(); // 🔧 FIX: Use fetchTasks instead of refetch
  // };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <SortableTaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete ? () => onTaskDelete(task) : handleTaskDelete}
            onDuplicate={handleTaskDuplicate}
            onClick={onTaskClick}
            isSelected={selectedTasks.has(task.id)}
            onSelect={onTaskSelect}
            showSelection={showBulkSelection}
          />
        ))}
      </SortableContext>

      {/* Add task button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start text-muted-foreground hover:text-foreground',
          'border-2 border-dashed border-border hover:border-border/80',
          'h-auto py-3 px-3 hover:bg-muted/50'
        )}
        onClick={handleAddTask}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Add a task
      </Button>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground text-sm">
            No tasks yet
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            Click &ldquo;Add a task&rdquo; to get started
          </div>
        </div>
      )}
    </div>
  );
}
