import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { UpdateBoardRequest } from '@/types/board'

// Validation schema
const updateBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Board name is required')
    .max(100, 'Board name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/boards/[boardId] - Get a specific board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            columns: true,
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Board fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/boards/[boardId] - Update a board
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params
    const body: UpdateBoardRequest = await request.json()

    // Validate request body
    const validatedData = updateBoardSchema.parse(body)

    // Check if board exists and user owns it
    const existingBoard = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: session.user.id,
      },
    })

    if (!existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Update board
    const board = await prisma.board.update({
      where: {
        id: boardId,
      },
      data: validatedData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            columns: true,
          },
        },
      },
    })

    return NextResponse.json({ board })
  } catch (error) {
    console.error('Board update error:', error)

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

// DELETE /api/boards/[boardId] - Delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { boardId } = await params

    // Check if board exists and user owns it
    const existingBoard = await prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId: session.user.id,
      },
    })

    if (!existingBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Delete board (cascades to columns and tasks)
    await prisma.board.delete({
      where: {
        id: boardId,
      },
    })

    return NextResponse.json({
      message: 'Board deleted successfully',
      boardId: boardId,
    })
  } catch (error) {
    console.error('Board deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
