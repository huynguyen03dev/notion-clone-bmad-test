import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper function to verify board access
async function verifyBoardAccess(userId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        {
          collaborators: {
            some: {
              userId,
              role: { in: ['VIEWER', 'EDITOR', 'ADMIN'] },
            },
          },
        },
        { isPublic: true }, // Allow access to public boards
      ],
    },
  })
  return !!board
}

// GET /api/boards/[boardId]/columns - Get all columns for a board
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

    // Verify user has access to the board
    const hasAccess = await verifyBoardAccess(session.user.id, boardId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Board not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch columns for the board
    const columns = await prisma.column.findMany({
      where: {
        boardId: boardId,
      },
      orderBy: {
        position: 'asc',
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ columns })
  } catch (error) {
    console.error('Columns fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
