'use client';

import { useState, useCallback } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableColumn } from './sortable-column';
import { AddColumnButton } from './add-column-button';
import { ColumnColorPicker } from './column-color-picker';
import { TaskList } from './task-list';
import { TaskCard } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { QuickTaskModal } from './quick-task-modal';
import { DeleteTaskDialog } from './delete-task-dialog';
import { BulkOperationsBar } from './bulk-operations-bar';
import { UndoToast } from './undo-toast';
import { useColumnApi } from '@/hooks/use-column-api';
import { useTaskApi } from '@/hooks/use-task-api';
import { useUserApi } from '@/hooks/use-user-api';
import { useUndoManager } from '@/hooks/use-undo-manager';
import { TaskWithDetails } from '@/types/task';
import { Button } from '@/components/ui/button';

interface Column {
  id: string;
  name: string;
  color?: string | null;
  position: number;
  _count: {
    tasks: number;
  };
}

interface KanbanBoardProps {
  boardId: string;
  columns: Column[];
  onColumnsUpdated?: () => void;
  onTaskEdit?: (task: TaskWithDetails) => void;
  onTaskClick?: (task: TaskWithDetails) => void;
  onAddTask?: (columnId: string) => void;
}

export function KanbanBoard({
  boardId,
  columns: initialColumns,
  onColumnsUpdated,
  onTaskEdit,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [colorPickerColumn, setColorPickerColumn] = useState<Column | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [quickTaskColumnId, setQuickTaskColumnId] = useState<string | null>(null);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithDetails | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkSelection, setShowBulkSelection] = useState(false);
  const { updateColumn, isLoading: isUpdatingColumn } = useColumnApi();
  const { updateTask, deleteTask, duplicateTask, createTask } = useTaskApi();
  const { users } = useUserApi();
  const {
    currentUndo,
    addTaskDeletion,
    addBulkTaskDeletion,
    clearCurrentUndo,
    executeUndo,
  } = useUndoManager();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'column') {
      setActiveColumn(active.data.current.column);
    } else if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveColumn(null);
    setActiveTask(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Handle column reordering
    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      const activeIndex = columns.findIndex((col) => col.id === active.id);
      const overIndex = columns.findIndex((col) => col.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newColumns = arrayMove(columns, activeIndex, overIndex);

        // Update positions based on new order
        const updatedColumns = newColumns.map((col, index) => ({
          ...col,
          position: index,
        }));

        // Optimistic update
        setColumns(updatedColumns);

        // Update the moved column's position on the server
        const result = await updateColumn(active.id as string, {
          position: overIndex,
        });

        if (result) {
          // Refresh columns from parent
          onColumnsUpdated?.();
        } else {
          // Revert optimistic update on error
          setColumns(initialColumns);
        }
      }
    }

    // Handle task movement
    if (active.data.current?.type === 'task') {
      const task = active.data.current.task as TaskWithDetails;
      let targetColumnId = task.columnId;
      let newPosition = task.position;

      // Determine target column and position
      if (over.data.current?.type === 'column') {
        // Dropped on a column - move to end of that column
        targetColumnId = over.id as string;
        newPosition = 0; // Will be calculated on server
      } else if (over.data.current?.type === 'task') {
        // Dropped on another task - insert at that position
        const overTask = over.data.current.task as TaskWithDetails;
        targetColumnId = overTask.columnId;
        newPosition = overTask.position;
      }

      // Only update if column or position changed
      if (targetColumnId !== task.columnId || newPosition !== task.position) {
        const result = await updateTask(task.id, {
          columnId: targetColumnId,
          position: newPosition,
        });

        if (result) {
          // Refresh columns to update task counts
          onColumnsUpdated?.();
        }
      }
    }
  };

  const handleColumnUpdated = useCallback(() => {
    onColumnsUpdated?.();
  }, [onColumnsUpdated]);

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSave = async (taskId: string, data: any) => {
    const result = await updateTask(taskId, data);
    if (result) {
      // Update the selected task with new data
      setSelectedTask(result);
      // Refresh columns to update task counts and data
      onColumnsUpdated?.();
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      onColumnsUpdated?.();
    }
  };

  const handleTaskDuplicate = async (taskId: string) => {
    const duplicatedTask = await duplicateTask(taskId);
    if (duplicatedTask) {
      onColumnsUpdated?.();
    }
  };

  const handleAddTask = (columnId: string) => {
    setQuickTaskColumnId(columnId);
    setIsQuickTaskModalOpen(true);
  };

  const handleQuickTaskModalClose = () => {
    setIsQuickTaskModalOpen(false);
    setQuickTaskColumnId(null);
  };

  const handleQuickTaskCreate = async (data: any) => {
    const newTask = await createTask(data);
    if (newTask) {
      onColumnsUpdated?.();
    }
  };

  // Delete confirmation handlers
  const handleDeleteClick = (task: TaskWithDetails) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (taskId: string) => {
    const task = taskToDelete;
    if (!task) return;

    // Find task position for undo
    const column = columns.find(col => col.id === task.columnId);
    const taskIndex = column?.tasks?.findIndex(t => t.id === taskId) ?? 0;

    const success = await deleteTask(taskId);
    if (success) {
      // Add to undo stack
      addTaskDeletion(task, taskIndex, task.columnId);
      onColumnsUpdated?.();
    }
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  // Bulk operations handlers
  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedTasks(new Set());
    setShowBulkSelection(false);
  };

  const handleBulkDelete = async (taskIds: string[]) => {
    const tasksToDelete = columns
      .flatMap(col => col.tasks || [])
      .filter(task => taskIds.includes(task.id))
      .map(task => {
        const column = columns.find(col => col.id === task.columnId);
        const taskIndex = column?.tasks?.findIndex(t => t.id === task.id) ?? 0;
        return {
          task,
          originalPosition: taskIndex,
          originalColumnId: task.columnId,
        };
      });

    // Delete all tasks
    const deletePromises = taskIds.map(id => deleteTask(id));
    const results = await Promise.all(deletePromises);

    if (results.every(success => success)) {
      // Add to undo stack
      addBulkTaskDeletion(tasksToDelete);
      onColumnsUpdated?.();
    }
  };

  const handleBulkDuplicate = async (taskIds: string[]) => {
    const duplicatePromises = taskIds.map(id => duplicateTask(id));
    const results = await Promise.all(duplicatePromises);

    if (results.some(task => task)) {
      onColumnsUpdated?.();
    }
  };

  const handleBulkMove = async (taskIds: string[], targetColumnId: string) => {
    const movePromises = taskIds.map(id =>
      updateTask(id, { columnId: targetColumnId })
    );
    const results = await Promise.all(movePromises);

    if (results.some(task => task)) {
      onColumnsUpdated?.();
    }
  };

  // Undo handlers
  const handleUndo = async () => {
    const success = await executeUndo(
      async (task, columnId, position) => {
        // Restore single task
        await createTask({
          ...task,
          columnId,
          position,
        });
        onColumnsUpdated?.();
      },
      async (tasks) => {
        // Restore multiple tasks
        const restorePromises = tasks.map(({ task, originalColumnId, originalPosition }) =>
          createTask({
            ...task,
            columnId: originalColumnId,
            position: originalPosition,
          })
        );
        await Promise.all(restorePromises);
        onColumnsUpdated?.();
      }
    );

    if (success) {
      console.log('Undo successful');
    }
  };

  const handleColumnDeleted = useCallback(() => {
    onColumnsUpdated?.();
  }, [onColumnsUpdated]);

  const handleColumnAdded = useCallback(() => {
    onColumnsUpdated?.();
  }, [onColumnsUpdated]);

  const handleColorChange = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      setColorPickerColumn(column);
    }
  }, [columns]);

  const handleColorUpdated = useCallback(() => {
    setColorPickerColumn(null);
    onColumnsUpdated?.();
  }, [onColumnsUpdated]);

  // Check if we've reached the maximum column limit
  const isAtMaxColumns = columns.length >= 10;

  return (
    <div className="p-6">
      {/* Bulk Selection Toggle */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showBulkSelection ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowBulkSelection(!showBulkSelection);
              if (showBulkSelection) {
                handleClearSelection();
              }
            }}
            className="h-8"
          >
            {showBulkSelection ? (
              <>
                <CheckSquare className="h-3 w-3 mr-1" />
                Exit Selection
              </>
            ) : (
              <>
                <Square className="h-3 w-3 mr-1" />
                Select Tasks
              </>
            )}
          </Button>
          {showBulkSelection && (
            <span className="text-xs text-gray-500">
              Click tasks to select them for bulk operations
            </span>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <SortableColumn
                key={column.id}
                column={column}
                availableColumns={columns}
                onColumnUpdated={handleColumnUpdated}
                onColumnDeleted={handleColumnDeleted}
                onColorChange={handleColorChange}
              >
                <TaskList
                  columnId={column.id}
                  boardId={boardId}
                  onTaskEdit={onTaskEdit}
                  onTaskClick={handleTaskClick}
                  onTaskDelete={handleDeleteClick}
                  onAddTask={handleAddTask}
                  selectedTasks={selectedTasks}
                  onTaskSelect={handleTaskSelect}
                  showBulkSelection={showBulkSelection}
                />
              </SortableColumn>
            ))}
          </SortableContext>

          <div className="flex-shrink-0">
            <AddColumnButton
              boardId={boardId}
              onColumnAdded={handleColumnAdded}
              disabled={isAtMaxColumns || isUpdatingColumn}
            />
            {isAtMaxColumns && (
              <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                Maximum of 10 columns reached
              </p>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeColumn && (
            <div className="bg-gray-50 rounded-lg border min-w-[280px] max-w-[280px] flex flex-col opacity-90 shadow-lg">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activeColumn.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {activeColumn._count.tasks}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-3 min-h-[200px] bg-gray-100">
                <div className="text-sm text-gray-500 text-center py-8">
                  Tasks will appear here
                </div>
              </div>
            </div>
          )}
          {activeTask && (
            <div className="rotate-2">
              <TaskCard task={activeTask} isDragging={true} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {colorPickerColumn && (
        <ColumnColorPicker
          column={colorPickerColumn}
          isOpen={!!colorPickerColumn}
          onClose={() => setColorPickerColumn(null)}
          onColorUpdated={handleColorUpdated}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={handleTaskModalClose}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onDuplicate={handleTaskDuplicate}
        availableUsers={users}
        isLoading={isUpdatingColumn}
      />

      {/* Quick Task Creation Modal */}
      {quickTaskColumnId && (
        <QuickTaskModal
          isOpen={isQuickTaskModalOpen}
          onClose={handleQuickTaskModalClose}
          onCreateTask={handleQuickTaskCreate}
          columnId={quickTaskColumnId}
          boardId={boardId}
          columnName={columns.find(col => col.id === quickTaskColumnId)?.name}
          isLoading={isUpdatingColumn}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteTaskDialog
        task={taskToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        isDeleting={isUpdatingColumn}
      />

      {/* Bulk Operations Bar */}
      {selectedTasks.size > 0 && (
        <BulkOperationsBar
          selectedTasks={columns
            .flatMap(col => col.tasks || [])
            .filter(task => selectedTasks.has(task.id))
          }
          onClearSelection={handleClearSelection}
          onDeleteTasks={handleBulkDelete}
          onDuplicateTasks={handleBulkDuplicate}
          onMoveTasks={handleBulkMove}
          availableColumns={columns.map(col => ({
            id: col.id,
            name: col.name,
            color: col.color,
          }))}
          isLoading={isUpdatingColumn}
        />
      )}

      {/* Undo Toast */}
      <UndoToast
        isVisible={!!currentUndo}
        message={currentUndo?.description || ''}
        onUndo={handleUndo}
        onDismiss={clearCurrentUndo}
      />
    </div>
  );
}
