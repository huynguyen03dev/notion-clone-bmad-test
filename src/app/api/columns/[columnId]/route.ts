import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Constants
const MAX_COLUMN_NAME_LENGTH = 100

// Validation schemas
const updateColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'Column name is required')
    .max(
      MAX_COLUMN_NAME_LENGTH,
      `Column name must be less than ${MAX_COLUMN_NAME_LENGTH} characters`
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color')
    .optional(),
  position: z
    .number()
    .int()
    .min(0, 'Position must be a non-negative integer')
    .optional(),
})

const deleteColumnSchema = z.object({
  taskAction: z.enum(['move', 'delete']),
  targetColumnId: z.string().optional(),
})

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
                role: { in: ['EDITOR', 'ADMIN'] },
              },
            },
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
  })
  return column
}

// PUT /api/columns/[columnId] - Update a column
export async function PUT(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { columnId } = params
    const body = await request.json()
    const validatedData = updateColumnSchema.parse(body)

    // Verify user has access to the column
    const column = await verifyColumnAccess(session.user.id, columnId)
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      )
    }

    // Handle position updates (for drag-and-drop reordering)
    if (validatedData.position !== undefined) {
      const boardId = column.board.id

      // Clean up any orphaned negative positions from previous failed transactions
      await prisma.column.updateMany({
        where: {
          boardId,
          position: { lt: 0 },
        },
        data: {
          position: 0,
        },
      })

      // Normalize requested position to valid range [0, maxIndex]
      const columnCount = await prisma.column.count({ where: { boardId } })
      const requestedPosition = validatedData.position
      const maxPosition = Math.max(0, columnCount - 1)
      const targetPosition = Math.max(
        0,
        Math.min(requestedPosition, maxPosition)
      )

      // Update positions for reordering
      const oldPosition = column.position
      const newPosition = targetPosition

      if (oldPosition !== newPosition) {
        // Use transaction to update positions atomically without violating unique(boardId, position)
        await prisma.$transaction(async (tx) => {
          // 1) Use a unique temporary position to avoid conflicts
          // Using negative timestamp ensures uniqueness across concurrent operations
          // Use a unique temporary negative position that fits 32-bit integer range to avoid overflow errors
          // Combine time modulo and randomness to reduce collision probability across concurrent operations
          const TEMP_POSITION = -(
            Math.floor(Date.now() % 1_000_000) + // 0..999,999
            Math.floor(Math.random() * 1_000_000) + // 0..999,999
            1 // ensure at least -1
          )

          try {
            await tx.column.update({
              where: { id: columnId },
              data: { position: TEMP_POSITION },
            })

            // 2) Shift the positions of the affected columns
            if (newPosition > oldPosition) {
              // Moving right: decrease positions of columns in between
              await tx.column.updateMany({
                where: {
                  boardId,
                  position: {
                    gt: oldPosition,
                    lte: newPosition,
                  },
                },
                data: {
                  position: {
                    decrement: 1,
                  },
                },
              })
            } else {
              // Moving left: increase positions of columns in between
              await tx.column.updateMany({
                where: {
                  boardId,
                  position: {
                    gte: newPosition,
                    lt: oldPosition,
                  },
                },
                data: {
                  position: {
                    increment: 1,
                  },
                },
              })
            }

            // 3) Place the target column into its final position (and apply any other provided updates)
            await tx.column.update({
              where: { id: columnId },
              data: { ...validatedData, position: newPosition },
            })
          } catch (error) {
            // If there's an error, ensure we clean up any temporary position
            console.error('Error during column reordering transaction:', error)
            throw error
          }
        })
      } else {
        // No position change, just update other fields
        await prisma.column.update({
          where: { id: columnId },
          data: validatedData,
        })
      }
    } else {
      // Simple update without position change
      await prisma.column.update({
        where: { id: columnId },
        data: validatedData,
      })
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
    })

    return NextResponse.json({ column: updatedColumn })
  } catch (error) {
    console.error('Column update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Position conflict detected. Please try again.' },
          { status: 409 }
        )
      }
      if (prismaError.code === 'P2025') {
        return NextResponse.json({ error: 'Column not found' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/columns/[columnId] - Delete a column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { columnId } = params
    const body = await request.json()
    const validatedData = deleteColumnSchema.parse(body)

    // Verify user has access to the column
    const column = await verifyColumnAccess(session.user.id, columnId)
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found or access denied' },
        { status: 404 }
      )
    }

    const boardId = column.board.id

    // Check minimum column requirement (at least 1 column must remain)
    const columnCount = await prisma.column.count({
      where: { boardId },
    })

    if (columnCount <= 1) {
      return NextResponse.json(
        {
          error:
            'Cannot delete the last column. At least one column must remain.',
        },
        { status: 400 }
      )
    }

    // Handle task migration
    if (column._count.tasks > 0) {
      if (validatedData.taskAction === 'move') {
        if (!validatedData.targetColumnId) {
          return NextResponse.json(
            { error: 'Target column ID is required when moving tasks' },
            { status: 400 }
          )
        }

        // Verify target column exists and user has access
        const targetColumn = await verifyColumnAccess(
          session.user.id,
          validatedData.targetColumnId
        )
        if (!targetColumn) {
          return NextResponse.json(
            { error: 'Target column not found or access denied' },
            { status: 404 }
          )
        }

        // Move tasks to target column
        await prisma.task.updateMany({
          where: { columnId },
          data: { columnId: validatedData.targetColumnId },
        })
      }
      // If taskAction is 'delete', tasks will be deleted via cascade
    }

    // Delete the column (and tasks if taskAction is 'delete')
    await prisma.$transaction(async (tx) => {
      // Delete the column
      await tx.column.delete({
        where: { id: columnId },
      })

      // Reorder remaining columns
      await tx.column.updateMany({
        where: {
          boardId,
          position: { gt: column.position },
        },
        data: {
          position: { decrement: 1 },
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Column deletion error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
