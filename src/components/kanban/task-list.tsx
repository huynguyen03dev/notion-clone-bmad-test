'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './sortable-task-card';
import { TaskWithDetails } from '@/types/task';
// 🚨 EMERGENCY FIX: Temporarily disable React Query to stop infinite loop
// import { useColumnTasks, useDeleteTask, useDuplicateTask } from '@/hooks/use-task-data';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

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
}: TaskListProps) {
  console.log('🔥 TaskList component rendered for column:', columnId);

  // 🚨 EMERGENCY SIMPLE SOLUTION: Basic state management to stop infinite loop
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Temporary alias to guard against stale references in compiled bundles
  const isLoading = loading;


  // 🔧 STABLE DATA FETCHING: Only fetch when columnId or boardId changes
  const fetchTasks = useCallback(async () => {
    if (!columnId || !boardId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tasks?columnId=${columnId}&boardId=${boardId}&sortBy=position&sortOrder=asc&limit=100`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      const data = await response.json();
      setTasks(data.tasks || []);
      console.log('✅ Simple fetch: Successfully loaded tasks:', data.tasks?.length || 0);
    } catch (err) {
      console.error('❌ Simple fetch: Failed to load tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [columnId, boardId]);

  // 🔧 STABLE EFFECT: Only run when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 🚨 SIMPLE HANDLERS: No complex mutations, just basic operations
  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');

      // Simple state update
      setTasks(prev => prev.filter(task => task.id !== taskId));
      console.log('✅ Simple delete: Task deleted successfully');
    } catch (error) {
      console.error('❌ Simple delete: Failed to delete task:', error);
    }
  };

  const handleTaskDuplicate = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, boardId })
      });

      if (!response.ok) throw new Error('Failed to duplicate task');

      // Refetch tasks to get the new one
      await fetchTasks();
      console.log('✅ Simple duplicate: Task duplicated successfully');
    } catch (error) {
      console.error('❌ Simple duplicate: Failed to duplicate task:', error);
    }
  };

  const handleAddTask = () => {
    onAddTask?.(columnId);
  };

  // 🚀 REACT QUERY SOLUTION: Simple refetch instead of complex refresh logic
  const refreshTasks = () => {
    console.log('🔄 Refreshing tasks for column:', columnId);
    fetchTasks(); // 🔧 FIX: Use fetchTasks instead of refetch
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg h-20 animate-pulse"
          />
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
            Click "Add a task" to get started
          </div>
        </div>
      )}
    </div>
  );
}
