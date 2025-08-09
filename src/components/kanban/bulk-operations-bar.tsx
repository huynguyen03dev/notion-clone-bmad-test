'use client';

import { useState } from 'react';
import {
  Trash2,
  Copy,
  Move,
  X,
  CheckSquare,
  Square,
  MoreHorizontal
} from 'lucide-react';
import { TaskWithDetails } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface BulkOperationsBarProps {
  selectedTasks: TaskWithDetails[];
  onClearSelection: () => void;
  onDeleteTasks: (taskIds: string[]) => Promise<void>;
  onDuplicateTasks: (taskIds: string[]) => Promise<void>;
  onMoveTasks: (taskIds: string[], targetColumnId: string) => Promise<void>;
  availableColumns: Array<{ id: string; name: string; color: string }>;
  isLoading?: boolean;
}

export function BulkOperationsBar({
  selectedTasks,
  onClearSelection,
  onDeleteTasks,
  onDuplicateTasks,
  onMoveTasks,
  availableColumns,
  isLoading = false,
}: BulkOperationsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedTasks.length === 0) return null;

  const handleDeleteSelected = async () => {
    setIsProcessing(true);
    try {
      const taskIds = selectedTasks.map(task => task.id);
      await onDeleteTasks(taskIds);
      onClearSelection();
    } catch (error) {
      console.error('Failed to delete tasks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicateSelected = async () => {
    setIsProcessing(true);
    try {
      const taskIds = selectedTasks.map(task => task.id);
      await onDuplicateTasks(taskIds);
      onClearSelection();
    } catch (error) {
      console.error('Failed to duplicate tasks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveSelected = async (targetColumnId: string) => {
    setIsProcessing(true);
    try {
      const taskIds = selectedTasks.map(task => task.id);
      await onMoveTasks(taskIds, targetColumnId);
      onClearSelection();
    } catch (error) {
      console.error('Failed to move tasks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isProcessing || isLoading;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[400px]">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
          </span>
          <Badge variant="secondary" className="text-xs">
            {selectedTasks.length}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Move to Column */}
          <Select onValueChange={handleMoveSelected} disabled={isDisabled}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Move to..." />
            </SelectTrigger>
            <SelectContent>
              {availableColumns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {/* Removed nested div - using text with color indicator via CSS */}
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    {column.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Duplicate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDuplicateSelected}
            disabled={isDisabled}
            className="h-8 px-3"
          >
            <Copy className="h-3 w-3 mr-1" />
            Duplicate
          </Button>

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDisabled}
            className="h-8 px-3 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isDisabled}
                className="h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-3 w-3" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('Export selected')}>
                Export Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Archive selected')}>
                Archive Tasks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Select all in column')}>
                Select All in Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isDisabled}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear selection</span>
          </Button>
        </div>

        {/* Loading Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
