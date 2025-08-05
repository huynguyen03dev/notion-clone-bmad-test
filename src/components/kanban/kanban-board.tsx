'use client';

import { useState, useCallback } from 'react';
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
import { useColumnApi } from '@/hooks/use-column-api';

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
}

export function KanbanBoard({
  boardId,
  columns: initialColumns,
  onColumnsUpdated,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [colorPickerColumn, setColorPickerColumn] = useState<Column | null>(null);
  const { updateColumn, isLoading: isUpdatingColumn } = useColumnApi();

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
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveColumn(null);
    
    if (!over || active.id === over.id) {
      return;
    }

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
  };

  const handleColumnUpdated = useCallback(() => {
    onColumnsUpdated?.();
  }, [onColumnsUpdated]);

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
                {/* Task components will go here in future stories */}
                <div className="text-sm text-gray-500 text-center py-8">
                  Tasks will appear here
                </div>
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
    </div>
  );
}
