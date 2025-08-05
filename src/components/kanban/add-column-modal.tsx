'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useColumnApi } from '@/hooks/use-column-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const addColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(100, 'Column name must be less than 100 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
});

type AddColumnFormData = z.infer<typeof addColumnSchema>;

interface AddColumnModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onColumnAdded: () => void;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function AddColumnModal({ boardId, isOpen, onClose, onColumnAdded }: AddColumnModalProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const { createColumn, isLoading } = useColumnApi();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddColumnFormData>({
    resolver: zodResolver(addColumnSchema),
  });

  const handleClose = () => {
    reset();
    setSelectedColor(undefined);
    onClose();
  };

  const onSubmit = async (data: AddColumnFormData) => {
    const result = await createColumn({
      ...data,
      boardId,
      color: selectedColor,
    });

    if (result) {
      onColumnAdded();
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
          <DialogDescription>
            Create a new column to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Column Name</Label>
            <Input
              id="name"
              placeholder="Enter column name"
              {...register('name')}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Column Color (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(selectedColor === color ? undefined : color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-sm text-gray-600">Selected color: {selectedColor}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Column
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
