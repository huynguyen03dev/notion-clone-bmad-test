import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  UpdateTaskRequest,
  DuplicateTaskRequest,
  TASK_VALIDATION,
} from '@/types/task'
import { TaskPriority } from '@prisma/client'

// Validation schemas
const updateTaskSchema = z.object({
  title: z
    .string()
    .min(TASK_VALIDATION.title.minLength, 'Task title is required')
    .max(
      TASK_VALIDATION.title.maxLength,
      `Task title must be less than ${TASK_VALIDATION.title.maxLength} characters`
    )
    .optional(),
  description: z
    .string()
    .max(
      TASK_VALIDATION.description.maxLength,
      `Description must be less than ${TASK_VALIDATION.description.maxLength} characters`
    )
    .nullable()
    .optional(),
  columnId: z.string().min(1, 'Column ID is required').optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().min(0).optional(),
})

const duplicateTaskSchema = z.object({
  columnId: z.string().optional(),
  position: z.number().min(0).optional(),
})

// Helper function to verify task access
async function verifyTaskAccess(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      board: {
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: {
                userId,
                role: { in: ['EDITOR', 'ADMIN'] },
              },
            },
          },
        ],
      },
    },
    include: {
      board: true,
      column: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })
  return task
}

// Helper function to verify column belongs to board
async function verifyColumnInBoard(columnId: string, boardId: string) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      boardId: boardId,
    },
  })
  return !!column
}

// Helper function to get next position in column
async function getNextPosition(columnId: string): Promise<number> {
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  })
  return (lastTask?.position ?? -1) + 1
}

// Helper function to reorder tasks when position changes
async function reorderTasks(
  columnId: string,
  newPosition: number,
  excludeTaskId?: string
) {
  // Get all tasks in column except the one being moved
  const tasks = await prisma.task.findMany({
    where: {
      columnId,
      ...(excludeTaskId && { id: { not: excludeTaskId } }),
    },
    orderBy: { position: 'asc' },
  })

  // Update positions
  const updates = tasks.map((task, index) => {
    const adjustedIndex = index >= newPosition ? index + 1 : index
    return prisma.task.update({
      where: { id: task.id },
      data: { position: adjustedIndex },
    })
  })

  await Promise.all(updates)
}

// GET /api/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await verifyTaskAccess(session.user.id, params.taskId)
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Get task with full details
    const taskWithDetails = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ task: taskWithDetails })
  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[taskId] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateTaskRequest = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Verify user has access to the task
    const existingTask = await verifyTaskAccess(session.user.id, params.taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // If changing column, verify it belongs to the same board
    if (
      validatedData.columnId &&
      validatedData.columnId !== existingTask.columnId
    ) {
      const columnInBoard = await verifyColumnInBoard(
        validatedData.columnId,
        existingTask.boardId
      )
      if (!columnInBoard) {
        return NextResponse.json(
          { error: 'Column not found in task board' },
          { status: 400 }
        )
      }
    }

    // If changing assignee, verify they exist
    if (
      validatedData.assigneeId !== undefined &&
      validatedData.assigneeId !== null
    ) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assigneeId },
      })
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 400 }
        )
      }
    }

    // Handle position changes
    let finalPosition = validatedData.position
    const isChangingColumn =
      validatedData.columnId && validatedData.columnId !== existingTask.columnId

    if (isChangingColumn) {
      // Moving to different column - get next position if not specified
      finalPosition =
        finalPosition ?? (await getNextPosition(validatedData.columnId!))
    } else if (validatedData.position !== undefined) {
      // Changing position within same column
      await reorderTasks(
        existingTask.columnId,
        validatedData.position,
        params.taskId
      )
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.columnId && { columnId: validatedData.columnId }),
        ...(validatedData.assigneeId !== undefined && {
          assigneeId: validatedData.assigneeId,
        }),
        ...(validatedData.priority && { priority: validatedData.priority }),
        ...(validatedData.dueDate !== undefined && {
          dueDate: validatedData.dueDate
            ? new Date(validatedData.dueDate)
            : null,
        }),
        ...(finalPosition !== undefined && { position: finalPosition }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('Task update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to the task
    const existingTask = await verifyTaskAccess(session.user.id, params.taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      )
    }

    // Delete task
    await prisma.task.delete({
      where: { id: params.taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
