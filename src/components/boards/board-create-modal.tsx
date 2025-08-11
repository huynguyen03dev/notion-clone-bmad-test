'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { BoardWithDetails } from '@/types/board'
import { useCreateBoard } from '@/hooks/use-boards'
import { toast } from 'sonner'

const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Board name is required')
    .max(100, 'Board name must be less than 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
})

type CreateBoardForm = z.infer<typeof createBoardSchema>

interface BoardCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBoardCreated: (board: BoardWithDetails) => void
}

export function BoardCreateModal({
  open,
  onOpenChange,
  onBoardCreated,
}: BoardCreateModalProps) {
  const createBoard = useCreateBoard()

  const form = useForm<CreateBoardForm>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateBoardForm) => {
    try {
      const result = await createBoard.mutateAsync({
        name: data.name,
        description: data.description || undefined,
      })

      const { board } = result || {}
      if (board) {
        onBoardCreated(board)
        form.reset()
      } else {
        throw new Error('Failed to create board')
      }
    } catch (error) {
      console.error('Board creation error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create board'
      )
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!createBoard.isPending) {
      onOpenChange(newOpen)
      if (!newOpen) {
        form.reset()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a new kanban board to organize your projects and tasks.
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
                      disabled={createBoard.isPending}
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
                      disabled={createBoard.isPending}
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
                disabled={createBoard.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBoard.isPending}>
                {createBoard.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Board
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
