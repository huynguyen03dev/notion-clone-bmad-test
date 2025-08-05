import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { DuplicateTaskRequest } from '@/types/task';

// Validation schema
const duplicateTaskSchema = z.object({
  columnId: z.string().optional(),
  position: z.number().min(0).optional(),
});

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
                role: { in: ['EDITOR', 'ADMIN'] } 
              } 
            } 
          },
        ],
      },
    },
    include: {
      board: true,
      column: true,
    },
  });
  return task;
}

// Helper function to verify column belongs to board
async function verifyColumnInBoard(columnId: string, boardId: string) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      boardId: boardId,
    },
  });
  return !!column;
}

// Helper function to get next position in column
async function getNextPosition(columnId: string): Promise<number> {
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (lastTask?.position ?? -1) + 1;
}

// POST /api/tasks/[taskId]/duplicate - Duplicate a task
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DuplicateTaskRequest = await request.json();
    const validatedData = duplicateTaskSchema.parse(body);

    // Verify user has access to the original task
    const originalTask = await verifyTaskAccess(session.user.id, params.taskId);
    if (!originalTask) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    // Determine target column (same column if not specified)
    const targetColumnId = validatedData.columnId || originalTask.columnId;

    // If changing column, verify it belongs to the same board
    if (targetColumnId !== originalTask.columnId) {
      const columnInBoard = await verifyColumnInBoard(targetColumnId, originalTask.boardId);
      if (!columnInBoard) {
        return NextResponse.json(
          { error: 'Target column not found in task board' },
          { status: 400 }
        );
      }
    }

    // Get position for duplicate
    const position = validatedData.position ?? await getNextPosition(targetColumnId);

    // Create duplicate task
    const duplicateTask = await prisma.task.create({
      data: {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        columnId: targetColumnId,
        boardId: originalTask.boardId,
        assigneeId: originalTask.assigneeId,
        priority: originalTask.priority,
        dueDate: originalTask.dueDate,
        position,
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
    });

    return NextResponse.json({ task: duplicateTask }, { status: 201 });

  } catch (error) {
    console.error('Task duplication error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
