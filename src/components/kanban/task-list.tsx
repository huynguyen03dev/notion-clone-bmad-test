'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from './sortable-task-card';
import { TaskWithDetails } from '@/types/task';
import { useTaskApi } from '@/hooks/use-task-api';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const { deleteTask, duplicateTask, isLoading } = useTaskApi();

  // Circuit breaker to prevent infinite API calls
  const circuitBreakerRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Fetch tasks function - COMPLETELY STABLE with NO dependencies to prevent infinite loops
  const fetchTasks = useCallback(async (columnId: string, boardId: string) => {
    console.log('📡 fetchTasks called for column:', columnId, 'board:', boardId);

    // CIRCUIT BREAKER: If we've already made a successful API call for this column, NEVER make another one
    const cacheKey = `${columnId}-${boardId}`;
    if (circuitBreakerRef.current === cacheKey) {
      console.log('🚫 CIRCUIT BREAKER: Preventing duplicate API call for column:', columnId);
      return;
    }

    try {
      setIsLoadingTasks(true);

      const searchParams = new URLSearchParams();
      searchParams.append('columnId', columnId);
      searchParams.append('boardId', boardId);
      searchParams.append('sortBy', 'position');
      searchParams.append('sortOrder', 'asc');

      const response = await fetch(`/api/tasks?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const result = await response.json();
      setTasks(result.tasks || []);

      // ACTIVATE CIRCUIT BREAKER for this column
      circuitBreakerRef.current = cacheKey;

    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []); // NO DEPENDENCIES - COMPLETELY STABLE

  // Load tasks for this column - run only once when component mounts or column changes
  useEffect(() => {
    console.log('🔍 Task load effect triggered for column:', columnId, 'board:', boardId);

    const cacheKey = `${columnId}-${boardId}`;

    // CIRCUIT BREAKER: If we've already made a successful API call for this column, NEVER make another one
    if (circuitBreakerRef.current === cacheKey) {
      console.log('🚫 CIRCUIT BREAKER: Preventing API call - already loaded for column:', columnId);
      return;
    }

    // Reset circuit breaker when column changes
    if (circuitBreakerRef.current && circuitBreakerRef.current !== cacheKey) {
      console.log('🔄 Column changed, resetting circuit breaker');
      circuitBreakerRef.current = null;
      hasLoadedRef.current = false;
    }

    if (!hasLoadedRef.current || circuitBreakerRef.current !== cacheKey) {
      console.log('🚀 Running fetchTasks for column:', columnId);
      hasLoadedRef.current = true;
      fetchTasks(columnId, boardId);
    }
  }, [columnId, boardId, fetchTasks]); // Only depend on columnId and boardId

  const handleTaskDelete = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      // Only call onTasksUpdated for user actions, not initial loads
      onTasksUpdated?.();
    }
  };

  const handleTaskDuplicate = async (taskId: string) => {
    const duplicatedTask = await duplicateTask(taskId, columnId);
    if (duplicatedTask) {
      setTasks(prev => [...prev, duplicatedTask]);
      // Only call onTasksUpdated for user actions, not initial loads
      onTasksUpdated?.();
    }
  };

  const handleAddTask = () => {
    onAddTask?.(columnId);
  };

  // Function to refresh tasks when needed (e.g., after task creation)
  const refreshTasks = useCallback(() => {
    console.log('🔄 Refreshing tasks for column:', columnId);
    // Reset circuit breaker to allow refresh
    circuitBreakerRef.current = null;
    hasLoadedRef.current = false;
    fetchTasks(columnId, boardId);
  }, [columnId, boardId, fetchTasks]);

  if (isLoadingTasks) {
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
          'w-full justify-start text-gray-500 hover:text-gray-700',
          'border-2 border-dashed border-gray-200 hover:border-gray-300',
          'h-auto py-3 px-3'
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
          <div className="text-gray-400 text-sm">
            No tasks yet
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Click "Add a task" to get started
          </div>
        </div>
      )}
    </div>
  );
}
