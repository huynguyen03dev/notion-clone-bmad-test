'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { TaskPriority } from '@prisma/client';
import { TASK_VALIDATION } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Quick task form schema (simplified)
const quickTaskSchema = z.object({
  title: z.string()
    .min(TASK_VALIDATION.title.minLength, 'Task title is required')
    .max(TASK_VALIDATION.title.maxLength, `Title must be less than ${TASK_VALIDATION.title.maxLength} characters`),
  description: z.string()
    .max(TASK_VALIDATION.description.maxLength, `Description must be less than ${TASK_VALIDATION.description.maxLength} characters`)
    .optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
});

type QuickTaskFormData = z.infer<typeof quickTaskSchema>;

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (data: QuickTaskFormData & { columnId: string; boardId: string }) => Promise<void>;
  columnId: string;
  boardId: string;
  columnName?: string;
  isLoading?: boolean;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  columnId,
  boardId,
  columnName,
  isLoading = false,
}: QuickTaskModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<QuickTaskFormData>({
    resolver: zodResolver(quickTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
    },
  });

  const handleSubmit = async (data: QuickTaskFormData) => {
    setIsCreating(true);
    try {
      await onCreateTask({
        ...data,
        columnId,
        boardId,
      });

      // Reset form and close modal on success
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Task
            {columnName && (
              <span className="text-sm font-normal text-gray-500">
                in {columnName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title..."
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>
                        {/* Removed nested div - using span elements for valid HTML */}
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          Low Priority
                        </span>
                      </SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                          Medium Priority
                        </span>
                      </SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                          High Priority
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isLoading}
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
