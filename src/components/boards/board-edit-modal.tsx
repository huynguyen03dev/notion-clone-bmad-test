'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BoardWithDetails, UpdateBoardRequest } from '@/types/board';
import { toast } from 'sonner';

const updateBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100, 'Board name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
});

type UpdateBoardForm = z.infer<typeof updateBoardSchema>;

interface BoardEditModalProps {
  board: BoardWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardUpdated: (board: BoardWithDetails) => void;
}

export function BoardEditModal({ board, open, onOpenChange, onBoardUpdated }: BoardEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateBoardForm>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      name: board.name,
      description: board.description || '',
    },
  });

  // Reset form when board changes
  useEffect(() => {
    form.reset({
      name: board.name,
      description: board.description || '',
    });
  }, [board, form]);

  const onSubmit = async (data: UpdateBoardForm) => {
    try {
      setIsSubmitting(true);

      const requestData: UpdateBoardRequest = {
        name: data.name,
        description: data.description || undefined,
      };

      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update board');
      }

      const { board: updatedBoard } = await response.json();
      onBoardUpdated(updatedBoard);
      onOpenChange(false);
    } catch (error) {
      console.error('Board update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset({
          name: board.name,
          description: board.description || '',
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
          <DialogDescription>
            Update your board name and description.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Board Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter board name..."
                      {...field}
                      disabled={isSubmitting}
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
                      placeholder="Describe what this board is for..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
