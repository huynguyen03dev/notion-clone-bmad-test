'use client';

import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ColumnHeader } from './column-header';

interface Column {
  id: string;
  name: string;
  color?: string | null;
  position: number;
  _count: {
    tasks: number;
  };
}

interface SortableColumnProps {
  column: Column;
  availableColumns: Column[];
  onColumnUpdated?: () => void;
  onColumnDeleted?: () => void;
  onColorChange?: (columnId: string) => void;
  children?: React.ReactNode;
}

export function SortableColumn({
  column,
  availableColumns,
  onColumnUpdated,
  onColumnDeleted,
  onColorChange,
  children,
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: `column-droppable-${column.id}`,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={`bg-muted/30 dark:bg-muted/20 rounded-lg border border-border min-w-[280px] max-w-[280px] flex flex-col ${isDragging ? 'opacity-50 shadow-lg' : ''
        } ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
      {...attributes}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <ColumnHeader
          column={column}
          availableColumns={availableColumns}
          onColumnUpdated={onColumnUpdated}
          onColumnDeleted={onColumnDeleted}
          onColorChange={onColorChange}
        />
      </div>

      <div className="flex-1 p-3 space-y-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
