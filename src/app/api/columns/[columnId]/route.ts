import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Constants
const MAX_COLUMN_NAME_LENGTH = 100;

// Validation schemas
const updateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(MAX_COLUMN_NAME_LENGTH, `Column name must be less than ${MAX_COLUMN_NAME_LENGTH} characters`).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  position: z.number().int().min(0, 'Position must be a non-negative integer').optional(),
});

const deleteColumnSchema = z.object({
  taskAction: z.enum(['move', 'delete']),
  targetColumnId: z.string().optional(),
});

// Helper function to verify column access
async function verifyColumnAccess(userId: string, columnId: string) {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
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
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
  return column;
}

// PUT /api/columns/[columnId] - Update a column
export async function PUT(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { columnId } = params;
    const body = await request.json();
    const validatedData = updateColumnSchema.parse(body);

    // Verify user has access to the column
    const column = await verifyColumnAccess(session.user.id, columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      );
    }

    // Handle position updates (for drag-and-drop reordering)
    if (validatedData.position !== undefined) {
      const boardId = column.board.id;
      


      // Update positions for reordering
      const oldPosition = column.position;
      const newPosition = validatedData.position;

      if (oldPosition !== newPosition) {
        // Use transaction to update positions atomically
        await prisma.$transaction(async (tx) => {
          if (newPosition > oldPosition) {
            // Moving right: decrease positions of columns in between
            await tx.column.updateMany({
              where: {
                boardId,
                position: {
                  gt: oldPosition,
                  lte: newPosition,
                },
                id: { not: columnId },
              },
              data: {
                position: {
                  decrement: 1,
                },
              },
            });
          } else {
            // Moving left: increase positions of columns in between
            await tx.column.updateMany({
              where: {
                boardId,
                position: {
                  gte: newPosition,
                  lt: oldPosition,
                },
                id: { not: columnId },
              },
              data: {
                position: {
                  increment: 1,
                },
              },
            });
          }

          // Update the target column
          await tx.column.update({
            where: { id: columnId },
            data: validatedData,
          });
        });
      } else {
        // No position change, just update other fields
        await prisma.column.update({
          where: { id: columnId },
          data: validatedData,
        });
      }
    } else {
      // Simple update without position change
      await prisma.column.update({
        where: { id: columnId },
        data: validatedData,
      });
    }

    // Fetch updated column
    const updatedColumn = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ column: updatedColumn });

  } catch (error) {
    console.error('Column update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/columns/[columnId] - Delete a column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { columnId } = params;
    const body = await request.json();
    const validatedData = deleteColumnSchema.parse(body);

    // Verify user has access to the column
    const column = await verifyColumnAccess(session.user.id, columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      );
    }

    const boardId = column.board.id;

    // Check minimum column requirement (at least 1 column must remain)
    const columnCount = await prisma.column.count({
      where: { boardId },
    });

    if (columnCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last column. At least one column must remain.' },
        { status: 400 }
      );
    }

    // Handle task migration
    if (column._count.tasks > 0) {
      if (validatedData.taskAction === 'move') {
        if (!validatedData.targetColumnId) {
          return NextResponse.json(
            { error: 'Target column ID is required when moving tasks' },
            { status: 400 }
          );
        }

        // Verify target column exists and user has access
        const targetColumn = await verifyColumnAccess(session.user.id, validatedData.targetColumnId);
        if (!targetColumn) {
          return NextResponse.json(
            { error: 'Target column not found or access denied' },
            { status: 404 }
          );
        }

        // Move tasks to target column
        await prisma.task.updateMany({
          where: { columnId },
          data: { columnId: validatedData.targetColumnId },
        });
      }
      // If taskAction is 'delete', tasks will be deleted via cascade
    }

    // Delete the column (and tasks if taskAction is 'delete')
    await prisma.$transaction(async (tx) => {
      // Delete the column
      await tx.column.delete({
        where: { id: columnId },
      });

      // Reorder remaining columns
      await tx.column.updateMany({
        where: {
          boardId,
          position: { gt: column.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Column deletion error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
