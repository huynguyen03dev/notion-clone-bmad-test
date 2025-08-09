'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, User, Flag, Clock, Copy, Trash2 } from 'lucide-react';
import { TaskWithDetails, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_VALIDATION } from '@/types/task';
import { TaskPriority } from '@prisma/client';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Form validation schema
const taskFormSchema = z.object({
  title: z.string()
    .min(TASK_VALIDATION.title.minLength, 'Task title is required')
    .max(TASK_VALIDATION.title.maxLength, `Title must be less than ${TASK_VALIDATION.title.maxLength} characters`),
  description: z.string()
    .max(TASK_VALIDATION.description.maxLength, `Description must be less than ${TASK_VALIDATION.description.maxLength} characters`)
    .optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskDetailModalProps {
  task: TaskWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, data: Partial<TaskFormData>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onDuplicate: (taskId: string) => Promise<void>;
  availableUsers?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  isLoading?: boolean;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  availableUsers = [],
  isLoading = false,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assigneeId: '',
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: task.assigneeId || '',
      });
    }
    setIsEditing(false);
  }, [task, form]);

  const handleSave = async (data: TaskFormData) => {
    if (!task) return;

    setIsSaving(true);
    try {
      const updateData: Partial<TaskFormData> = {};

      // Only include changed fields
      if (data.title !== task.title) updateData.title = data.title;
      if (data.description !== (task.description || '')) updateData.description = data.description;
      if (data.priority !== task.priority) updateData.priority = data.priority;
      if (data.assigneeId !== (task.assigneeId || '')) updateData.assigneeId = data.assigneeId;

      // Handle due date
      const currentDueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      if (data.dueDate !== currentDueDate) {
        updateData.dueDate = data.dueDate;
      }

      await onSave(task.id, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    await onDelete(task.id);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!task) return;
    await onDuplicate(task.id);
    onClose();
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'No due date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = task?.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task?.dueDate &&
    new Date(task.dueDate) > new Date() &&
    new Date(task.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">
              {isEditing ? 'Edit Task' : task.title}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn('text-xs', TASK_PRIORITY_COLORS[task.priority])}
              >
                <Flag className="w-3 h-3 mr-1" />
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title..." {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {/* Removed nested div - using span for valid HTML */}
                              <span className="flex items-center gap-2">
                                <Flag className="w-3 h-3" />
                                {label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">
                          {/* Removed nested div - using span for valid HTML */}
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Unassigned
                          </span>
                        </SelectItem>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <span className="flex items-center gap-2">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-xs">
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {user.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            {/* Task Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Task Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Due Date</p>
                  <p className={cn(
                    'text-sm font-medium',
                    isOverdue && 'text-red-600',
                    isDueSoon && 'text-orange-600',
                    !isOverdue && !isDueSoon && 'text-foreground'
                  )}>
                    {formatDate(task.dueDate)}
                  </p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Assignee</p>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={task.assignee.avatar || undefined} alt={task.assignee.name || 'Assignee'} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {task.assignee.name}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Column</p>
                <p className="text-sm font-medium">{task.column.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Board</p>
                <p className="text-sm font-medium">{task.board.name}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={isLoading}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
              <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                Edit Task
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
