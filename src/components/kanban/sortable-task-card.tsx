'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './task-card';
import { TaskWithDetails } from '@/types/task';

interface SortableTaskCardProps {
  task: TaskWithDetails;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onClick?: (task: TaskWithDetails) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
  isSelected,
  onSelect,
  showSelection,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onClick={onClick}
        isDragging={isDragging}
        isSelected={isSelected}
        onSelect={onSelect}
        showSelection={showSelection}
      />
    </div>
  );
}
