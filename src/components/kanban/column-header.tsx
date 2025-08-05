'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ColumnDeleteDialog } from './column-delete-dialog';
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

interface ColumnHeaderProps {
  column: Column;
  availableColumns?: Column[];
  onColumnUpdated?: () => void;
  onColumnDeleted?: () => void;
  onColorChange?: (columnId: string) => void;
}

export function ColumnHeader({
  column,
  availableColumns = [],
  onColumnUpdated,
  onColumnDeleted,
  onColorChange
}: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateColumn, isLoading } = useColumnApi();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditName(column.name);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(column.name);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (editName.trim() === column.name || !editName.trim()) {
      handleCancelEdit();
      return;
    }

    const result = await updateColumn(column.id, { name: editName.trim() });

    if (result) {
      setIsEditing(false);
      onColumnUpdated?.();
    } else {
      // Revert to original name on error
      setEditName(column.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteColumn = () => {
    setShowDeleteDialog(true);
  };

  const handleColumnDeleted = () => {
    setShowDeleteDialog(false);
    onColumnDeleted?.();
  };

  const handleColorChange = () => {
    onColorChange?.(column.id);
  };

  return (
    <div 
      className="flex items-center justify-between p-3 border-b"
      style={{ 
        borderLeftColor: column.color || 'transparent',
        borderLeftWidth: column.color ? '4px' : '0px',
        borderLeftStyle: 'solid'
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            disabled={isLoading}
            className="h-8 text-sm font-medium"
            maxLength={100}
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="text-sm font-medium text-start hover:text-blue-600 transition-colors flex-1"
            title="Click to edit column name"
          >
            {column.name}
          </button>
        )}
        
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {column._count.tasks}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Column options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleStartEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename Column
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleColorChange}>
            <Palette className="mr-2 h-4 w-4" />
            Change Color
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteColumn}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ColumnDeleteDialog
        column={column}
        availableColumns={availableColumns}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onColumnDeleted={handleColumnDeleted}
      />
    </div>
  );
}
