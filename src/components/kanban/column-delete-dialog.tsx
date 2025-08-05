'use client';

import { useState } from 'react';
import { useColumnApi } from '@/hooks/use-column-api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Column {
  id: string;
  name: string;
  _count: {
    tasks: number;
  };
}

interface ColumnDeleteDialogProps {
  column: Column;
  availableColumns: Column[];
  isOpen: boolean;
  onClose: () => void;
  onColumnDeleted: () => void;
}

export function ColumnDeleteDialog({
  column,
  availableColumns,
  isOpen,
  onClose,
  onColumnDeleted,
}: ColumnDeleteDialogProps) {
  const [taskAction, setTaskAction] = useState<'move' | 'delete'>('move');
  const [targetColumnId, setTargetColumnId] = useState<string>('');
  const { deleteColumn, isLoading } = useColumnApi();

  const handleClose = () => {
    setTaskAction('move');
    setTargetColumnId('');
    onClose();
  };

  const handleDelete = async () => {
    if (taskAction === 'move' && !targetColumnId) {
      // This validation should be handled by the UI, but adding as safety check
      return;
    }

    const success = await deleteColumn(column.id, {
      taskAction,
      targetColumnId: taskAction === 'move' ? targetColumnId : undefined,
    });

    if (success) {
      onColumnDeleted();
      handleClose();
    }
  };

  const hasOtherColumns = availableColumns.filter(c => c.id !== column.id).length > 0;
  const hasTasks = column._count.tasks > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Column &quot;{column.name}&quot;
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the column.
            {hasTasks && (
              <span className="block mt-2 font-medium text-orange-600">
                This column contains {column._count.tasks} task{column._count.tasks !== 1 ? 's' : ''}. 
                What would you like to do with them?
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasTasks && (
          <div className="space-y-4">
            <RadioGroup value={taskAction} onValueChange={(value) => setTaskAction(value as 'move' | 'delete')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="move" id="move" />
                <Label htmlFor="move" className="font-normal">
                  Move tasks to another column
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete" className="font-normal text-red-600">
                  Delete all tasks permanently
                </Label>
              </div>
            </RadioGroup>

            {taskAction === 'move' && hasOtherColumns && (
              <div className="space-y-2">
                <Label htmlFor="target-column">Target Column</Label>
                <Select value={targetColumnId} onValueChange={setTargetColumnId}>
                  <SelectTrigger id="target-column">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns
                      .filter(c => c.id !== column.id)
                      .map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name} ({col._count.tasks} tasks)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {taskAction === 'move' && !hasOtherColumns && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  No other columns available. Tasks will be deleted along with the column.
                </p>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || (taskAction === 'move' && hasTasks && !targetColumnId && hasOtherColumns)}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Column
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
