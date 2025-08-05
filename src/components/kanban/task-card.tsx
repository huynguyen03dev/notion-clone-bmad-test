'use client';

import { useState } from 'react';
import { MoreHorizontal, Calendar, User, Copy, Edit, Trash2, CheckSquare, Square, Flag } from 'lucide-react';
import { TaskWithDetails, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithDetails;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onClick?: (task: TaskWithDetails) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onDuplicate,
  onClick,
  isDragging = false,
  isSelected = false,
  onSelect,
  showSelection = false,
}: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on dropdown menu
    if (e.target !== e.currentTarget && !e.currentTarget.contains(e.target as Node)) {
      return;
    }
    onClick?.(task);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(task.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDuplicate?.(task.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(task.id, !isSelected);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return null;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate &&
    new Date(task.dueDate) > new Date() &&
    new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-3 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        isDragging && 'opacity-50 shadow-lg rotate-2',
        'group relative',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
          : 'border-gray-200'
      )}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <div className="absolute top-2 left-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelect}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
            <span className="sr-only">
              {isSelected ? 'Deselect task' : 'Select task'}
            </span>
          </Button>
        </div>
      )}

      {/* Header with title and menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={cn(
          "text-sm font-medium text-gray-900 line-clamp-2 flex-1",
          showSelection && "ml-6"
        )}>
          {task.title}
        </h3>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open task menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority badge */}
      <div className="flex items-center justify-between mb-3">
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            TASK_PRIORITY_COLORS[task.priority]
          )}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      {/* Footer with due date and assignee */}
      <div className="flex items-center justify-between">
        {/* Due date */}
        <div className="flex items-center gap-1">
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue && 'text-red-600',
              isDueSoon && 'text-orange-600',
              !isOverdue && !isDueSoon && 'text-gray-500'
            )}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={task.assignee.avatar || undefined}
                  alt={task.assignee.name || 'Assignee'}
                />
                <AvatarFallback className="text-xs">
                  {task.assignee.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 max-w-[80px] truncate">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <User className="h-3 w-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
